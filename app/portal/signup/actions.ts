"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow } from "@/lib/supabase/helpers";
import { isCqgDomain, isCqgUniFormat } from "@/lib/domains";
import { sendVerificationEmail } from "@/lib/email";
import { GRAD_YEARS } from "@/lib/data/grad-years";
import type { CqgSchool } from "@/lib/supabase/types";

export interface SignupState {
    error?: string;
}

const VALID_SCHOOLS: CqgSchool[] = ["CC", "SEAS", "Barnard", "GS", "GRAD"];
const VALID_GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    const school = String(formData.get("school") || "") as CqgSchool;
    const gradProgram = String(formData.get("grad_program") || "").trim();
    const year = String(formData.get("year") || "").trim();
    const major = String(formData.get("major") || "").trim();
    const gender = String(formData.get("gender") || "").trim();
    const agree = formData.get("agree") === "on";

    if (!email || !password || !name || !school || !year || !major || !gender) {
        return { error: "All fields are required." };
    }
    if (!VALID_SCHOOLS.includes(school)) {
        return { error: "Please choose a valid school." };
    }
    if (!GRAD_YEARS.includes(year)) {
        return { error: "Please choose a valid graduation term." };
    }
    if (!VALID_GENDERS.includes(gender)) {
        return { error: "Please choose a valid gender." };
    }
    if (!isCqgDomain(email)) {
        return { error: "You need a columbia.edu or barnard.edu email to create a CQG account." };
    }
    if (!isCqgUniFormat(email)) {
        return { error: "Your email must be your UNI address, e.g. abc1234@columbia.edu." };
    }
    if (password.length < 8) {
        return { error: "Password must be at least 8 characters." };
    }
    if (school === "GRAD" && !gradProgram) {
        return { error: "Please tell us which graduate program you're in." };
    }
    if (!agree) {
        return { error: "You must agree to the Privacy Policy to create an account." };
    }

    const admin = createServiceRoleClient();

    const { data: existing } = await admin
        .from("cqg_profiles")
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
        options: { redirectTo: `${siteUrl}/portal/verify` },
    });

    if (linkError || !linkData?.user) {
        return { error: linkError?.message || "Could not create your account. Please try again." };
    }

    const { error: profileError } = await insertRow(admin, "cqg_profiles", {
        id: linkData.user.id,
        email,
        name,
        school,
        grad_program: school === "GRAD" ? gradProgram : null,
        year,
        major,
        gender,
    });

    if (profileError) {
        console.error("[signup] profile insert failed:", profileError);
        // Don't leave an orphaned auth user behind if the profile insert failed.
        await admin.auth.admin.deleteUser(linkData.user.id);
        return { error: "Could not create your profile. Please try again." };
    }

    await sendVerificationEmail(email, name, linkData.properties.action_link);

    redirect("/portal/login?justSignedUp=1");
}
