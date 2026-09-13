"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isCqgDomain } from "@/lib/domains";
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
    const next = String(formData.get("next") || "/portal/dashboard");

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    // CQG and CUTC accounts share one Supabase Auth user pool, so a CUTC
    // account's credentials would otherwise authenticate here too and then
    // dead-end (no matching cqg_profiles row) with no explanation. Reject by
    // domain up front instead of letting that happen silently.
    //
    // Domain only. There used to be a UNI-format check here as well
    // (/^[a-z]{2,3}[0-9]{4}$/ on the local part) which locked existing users
    // out of accounts they had already created -- Barnard addresses are
    // usually firstname.lastname@barnard.edu and never matched it. Login is
    // the wrong place to enforce a signup rule; see lib/domains.ts.
    if (!isCqgDomain(email)) {
        return {
            error: "That's not a columbia.edu or barnard.edu email — log in through the CUTC portal instead.",
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Distinguish the one failure a user can actually act on. Everything
        // else stays deliberately vague so this can't be used to enumerate
        // which addresses have accounts.
        if (error.code === "email_not_confirmed") {
            return {
                error: "You haven't verified your email address yet — check your inbox for the verification link.",
                unverifiedEmail: email,
            };
        }
        if (error.code !== "invalid_credentials") {
            console.error(`[login] unexpected auth error for ${email}:`, error);
        }
        return { error: "Incorrect email or password." };
    }

    redirect(next.startsWith("/portal") ? next : "/portal/dashboard");
}

// Resend the verification link for an account that exists but was never
// confirmed. Only reachable after a password check has already succeeded
// (loginAction sets unverifiedEmail), so this isn't an open relay.
export async function resendVerificationAction(
    _prev: LoginState,
    formData: FormData
): Promise<LoginState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email || !isCqgDomain(email)) {
        return { error: "Incorrect email or password." };
    }

    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: profile } = await admin
        .from("cqg_profiles")
        .select("name")
        .eq("email", email)
        .maybeSingle()
        // Same postgrest-js inference bug worked around in lib/supabase/helpers.ts.
        .overrideTypes<{ name: string }, { merge: false }>();

    // A magiclink (not type: "signup", which errors for an existing user)
    // confirms the address when clicked, which is exactly what's needed here.
    const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${siteUrl}/portal/verify` },
    });

    if (error || !data?.properties?.action_link) {
        console.error(`[login] resend verification failed for ${email}:`, error);
        return { error: "Could not send a new link. Please try again in a minute." };
    }

    await sendVerificationEmail(email, profile?.name ?? "there", data.properties.action_link);
    return { resent: true };
}
