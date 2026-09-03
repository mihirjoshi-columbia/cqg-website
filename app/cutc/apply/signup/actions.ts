"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow } from "@/lib/supabase/helpers";
import { isCutcEmail } from "@/lib/domains";
import { sendVerificationEmail } from "@/lib/email";

export interface SignupState {
    error?: string;
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    const school = String(formData.get("school") || "").trim();
    const year = String(formData.get("year") || "").trim();
    const attestation = formData.get("attestation") === "on";
    const agree = formData.get("agree") === "on";

    if (!email || !password || !name || !school || !year) {
        return { error: "All fields are required." };
    }
    if (!isCutcEmail(email)) {
        return {
            error:
                "You need a non-Columbia .edu email for a CUTC account. Columbia/Barnard students apply to CUTC from inside their CQG portal account instead.",
        };
    }
    if (password.length < 8) {
        return { error: "Password must be at least 8 characters." };
    }
    if (!attestation) {
        return { error: "You must confirm you're a current undergraduate at an accredited US institution." };
    }
    if (!agree) {
        return { error: "You must agree to the Privacy Policy to create an account." };
    }

    const admin = createServiceRoleClient();

    const { data: existing } = await admin
        .from("cutc_profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
    if (existing) {
        return { error: "An account with this email already exists — try logging in instead." };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { redirectTo: `${siteUrl}/cutc/apply/verify` },
    });

    if (linkError || !linkData?.user) {
        return { error: linkError?.message || "Could not create your account. Please try again." };
    }

    const { error: profileError } = await insertRow(admin, "cutc_profiles", {
        id: linkData.user.id,
        email,
        name,
        school,
        year,
        attestation,
    });

    if (profileError) {
        console.error("[cutc signup] profile insert failed:", profileError);
        await admin.auth.admin.deleteUser(linkData.user.id);
        return { error: "Could not create your profile. Please try again." };
    }

    await sendVerificationEmail(email, name, linkData.properties.action_link);

    redirect("/cutc/apply/login?justSignedUp=1");
}
