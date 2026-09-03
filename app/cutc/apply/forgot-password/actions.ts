"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { isCutcEmail } from "@/lib/domains";
import { sendPasswordResetEmail } from "@/lib/email";

export interface ForgotPasswordState {
    submitted?: boolean;
}

export async function forgotPasswordAction(
    _prev: ForgotPasswordState,
    formData: FormData
): Promise<ForgotPasswordState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();

    if (email && isCutcEmail(email)) {
        const admin = createServiceRoleClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        const { data, error } = await admin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${siteUrl}/cutc/apply/verify?type=recovery` },
        });

        if (!error && data?.properties?.action_link) {
            await sendPasswordResetEmail(email, data.properties.action_link);
        }
    }

    return { submitted: true };
}
