"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCqgDomain, isCqgUniFormat } from "@/lib/domains";

export interface LoginState {
    error?: string;
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
    if (!isCqgDomain(email)) {
        return {
            error: "That's not a columbia.edu or barnard.edu email — log in through the CUTC portal instead.",
        };
    }
    if (!isCqgUniFormat(email)) {
        return { error: "That doesn't look like a valid Columbia/Barnard UNI email address." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: "Incorrect email or password." };
    }

    redirect(next.startsWith("/portal") ? next : "/portal/dashboard");
}
