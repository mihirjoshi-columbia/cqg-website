"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isCttLoginDomain } from "@/lib/domains";
import { sendVerificationEmail } from "@/lib/email";

export interface LoginState {
    error?: string;
    // Set when the credentials were correct but the address was never
    // verified, so the form can offer a resend instead of dead-ending.
    unverifiedEmail?: string;
    resent?: boolean;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const next = String(formData.get("next") || "/ctt/apply/dashboard");

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    // CQG and CTT accounts share one Supabase Auth user pool, so a CQG
    // account's credentials would otherwise authenticate here too and then
    // dead-end (no matching ctt_profiles row) with no explanation. Reject by
    // domain up front instead of letting that happen silently.
    //
    // Routing check only -- the academic-domain requirement belongs at signup
    // (isCttEmail), not here. Enforcing it at login locked out existing
    // accounts whose address didn't match the rules as they stand today.
    if (!isCttLoginDomain(email)) {
        return {
            error:
                "Columbia/Barnard accounts apply to CTT from inside their CQG portal account — log in through the CQG portal instead.",
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.code === "email_not_confirmed") {
            return {
                error: "You haven't verified your email address yet — check your inbox for the verification link.",
                unverifiedEmail: email,
            };
        }
        if (error.code !== "invalid_credentials") {
            console.error(`[ctt login] unexpected auth error for ${email}:`, error);
        }
        return { error: "Incorrect email or password." };
    }

    redirect(next.startsWith("/ctt/apply") ? next : "/ctt/apply/dashboard");
}

// See the CQG portal's equivalent in app/portal/login/actions.ts.
export async function resendVerificationAction(
    _prev: LoginState,
    formData: FormData
): Promise<LoginState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email || !isCttLoginDomain(email)) {
        return { error: "Incorrect email or password." };
    }

    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: profile } = await admin
        .from("ctt_profiles")
        .select("name")
        .eq("email", email)
        .maybeSingle()
        // Same postgrest-js inference bug worked around in lib/supabase/helpers.ts.
        .overrideTypes<{ name: string }, { merge: false }>();

    const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${siteUrl}/ctt/apply/verify` },
    });

    if (error || !data?.properties?.action_link) {
        console.error(`[ctt login] resend verification failed for ${email}:`, error);
        return { error: "Could not send a new link. Please try again in a minute." };
    }

    try {
        await sendVerificationEmail(email, profile?.name ?? "there", data.properties.action_link);
    } catch (err) {
        console.error(`[login] verification email failed for ${email}:`, err);
        return { error: "Could not send a new link. Please try again in a minute." };
    }
    return { resent: true };
}
