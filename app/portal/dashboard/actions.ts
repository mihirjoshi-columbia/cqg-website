"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow, updateRow } from "@/lib/supabase/helpers";
import type { CqgProfile, CqgSchool, CqgMembershipCycle, CutcCycle } from "@/lib/supabase/types";

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/portal/login");
}

const VALID_SCHOOLS: CqgSchool[] = ["CC", "SEAS", "Barnard", "GS", "GRAD"];

export interface ProfileUpdateState {
    error?: string;
    success?: boolean;
}

export async function updateProfileAction(
    _prev: ProfileUpdateState,
    formData: FormData
): Promise<ProfileUpdateState> {
    const name = String(formData.get("name") || "").trim();
    const school = String(formData.get("school") || "") as CqgSchool;
    const gradProgram = String(formData.get("grad_program") || "").trim();
    const year = String(formData.get("year") || "").trim();
    const major = String(formData.get("major") || "").trim();

    if (!name || !school || !year || !major) {
        return { error: "All fields are required." };
    }
    if (!VALID_SCHOOLS.includes(school)) {
        return { error: "Please choose a valid school." };
    }
    if (school === "GRAD" && !gradProgram) {
        return { error: "Please tell us which graduate program you're in." };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { error } = await updateRow(supabase, "cqg_profiles", user.id, {
        name,
        school,
        grad_program: school === "GRAD" ? gradProgram : null,
        year,
        major,
    });

    if (error) {
        console.error("[dashboard] profile update failed:", error);
        return { error: "Could not update your profile. Please try again." };
    }

    revalidatePath("/portal/dashboard");
    return { success: true };
}

export interface ResumeUploadState {
    error?: string;
    success?: boolean;
}

const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export async function uploadResumeAction(
    _prev: ResumeUploadState,
    formData: FormData
): Promise<ResumeUploadState> {
    const file = formData.get("resume");
    if (!(file instanceof File) || file.size === 0) {
        return { error: "Please choose a file." };
    }
    if (file.type !== "application/pdf") {
        return { error: "Resumes must be a PDF." };
    }
    if (file.size > RESUME_MAX_BYTES) {
        return { error: "File must be under 5MB." };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const path = `cqg/${user.id}/resume.pdf`;
    const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });

    if (uploadError) {
        console.error("[dashboard] resume upload failed:", uploadError);
        return { error: "Could not upload your resume. Please try again." };
    }

    const { error: updateError } = await updateRow(supabase, "cqg_profiles", user.id, {
        resume_path: path,
    });
    if (updateError) {
        console.error("[dashboard] resume_path update failed:", updateError);
        return { error: "Resume uploaded, but we couldn't save it to your profile. Try again." };
    }

    revalidatePath("/portal/dashboard");
    return { success: true };
}

export async function getResumeUrlAction(): Promise<{ url?: string; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("resume_path")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<{ resume_path: string | null }, { merge: false }>();

    if (!profile?.resume_path) {
        return { error: "No resume on file." };
    }

    const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(profile.resume_path, 60);

    if (error || !data) {
        return { error: "Could not generate a link. Please try again." };
    }

    return { url: data.signedUrl };
}

export async function deleteAccountAction() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const admin = createServiceRoleClient();
    // Best-effort — the account deletion below is what actually matters.
    await admin.storage.from("resumes").remove([`cqg/${user.id}/resume.pdf`]);
    await admin.auth.admin.deleteUser(user.id);

    try {
        await supabase.auth.signOut();
    } catch {
        // session is already invalid once the underlying user is gone
    }

    redirect("/portal/login?accountDeleted=1");
}

export async function applyForMembershipAction() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    if (!profile || profile.tier !== "general_body" || profile.school === "GRAD") {
        return; // not eligible — button shouldn't have been shown in the first place
    }

    const now = new Date().toISOString();
    const { data: cycle } = await supabase
        .from("cqg_membership_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CqgMembershipCycle, { merge: false }>();

    if (!cycle) {
        return; // no open cycle right now
    }

    const { error } = await insertRow(supabase, "cqg_membership_applications", {
        profile_id: user.id,
        cycle_id: cycle.id,
        short_answer: null,
    });

    if (error) {
        console.error("[dashboard] membership application insert failed:", error);
    }

    revalidatePath("/portal/dashboard");
}

export async function applyForCutcAction() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    // Internal Members can't apply while they hold that tier — re-checked
    // live against current tier, so stepping back to general_body reopens
    // eligibility automatically.
    if (!profile || profile.tier === "member") {
        return;
    }

    const now = new Date().toISOString();
    const { data: cycle } = await supabase
        .from("cutc_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CutcCycle, { merge: false }>();

    if (!cycle) {
        return; // no open cycle right now
    }

    const { error } = await insertRow(supabase, "cutc_applications", {
        cycle_id: cycle.id,
        applicant_type: "cqg_member",
        cqg_profile_id: user.id,
        cutc_profile_id: null,
    });

    if (error) {
        console.error("[dashboard] cutc application insert failed:", error);
    }

    revalidatePath("/portal/dashboard");
}
