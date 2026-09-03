"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { isCqgEmail } from "@/lib/domains";
import { sendPasswordResetEmail } from "@/lib/email";

export interface ForgotPasswordState {
    submitted?: boolean;
}

// Always returns the same "submitted" result regardless of whether the email
// is registered, so this endpoint can't be used to enumerate accounts.
export async function forgotPasswordAction(
    _prev: ForgotPasswordState,
    formData: FormData
): Promise<ForgotPasswordState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();

    if (email && isCqgEmail(email)) {
        const admin = createServiceRoleClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        const { data, error } = await admin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${siteUrl}/portal/verify?type=recovery` },
        });

        if (!error && data?.properties?.action_link) {
            await sendPasswordResetEmail(email, data.properties.action_link);
        }
    }

    return { submitted: true };
}
