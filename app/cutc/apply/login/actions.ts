"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCutcEmail } from "@/lib/domains";

export interface LoginState {
    error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const next = String(formData.get("next") || "/cutc/apply/dashboard");

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    // CQG and CUTC accounts share one Supabase Auth user pool, so a CQG
    // account's credentials would otherwise authenticate here too and then
    // dead-end (no matching cutc_profiles row) with no explanation. Reject by
    // domain up front instead of letting that happen silently.
    if (!isCutcEmail(email)) {
        return {
            error:
                "Columbia/Barnard accounts apply to CUTC from inside their CQG portal account — log in through the CQG portal instead.",
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: "Incorrect email or password." };
    }

    redirect(next.startsWith("/cutc/apply") ? next : "/cutc/apply/dashboard");
}
