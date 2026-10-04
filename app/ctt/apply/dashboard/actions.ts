"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow, updateRow } from "@/lib/supabase/helpers";
import { parseCttApplicationExtras } from "@/lib/ctt-application";
import { RESUME_MAX_BYTES, RESUME_MAX_LABEL, looksLikePdf } from "@/lib/resume-file";
import type { CttCycle } from "@/lib/supabase/types";

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/ctt/apply/login");
}

export interface ProfileUpdateState {
    error?: string;
    success?: boolean;
}

export async function updateProfileAction(
    _prev: ProfileUpdateState,
    formData: FormData
): Promise<ProfileUpdateState> {
    const name = String(formData.get("name") || "").trim();

    if (!name) {
        return { error: "All fields are required." };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/ctt/apply/login");

    const { error } = await updateRow(supabase, "ctt_profiles", user.id, { name });
    if (error) {
        console.error("[ctt dashboard] profile update failed:", error);
        return { error: "Could not update your profile. Please try again." };
    }

    revalidatePath("/ctt/apply/dashboard");
    return { success: true };
}

export interface ResumeUploadState {
    error?: string;
    success?: boolean;
}

export async function uploadResumeAction(
    _prev: ResumeUploadState,
    formData: FormData
): Promise<ResumeUploadState> {
    const file = formData.get("resume");
    if (!(file instanceof File) || file.size === 0) {
        return { error: "Please choose a file." };
    }
    if (!(await looksLikePdf(file))) {
        return { error: "Resumes must be a PDF." };
    }
    if (file.size > RESUME_MAX_BYTES) {
        return { error: `File must be under ${RESUME_MAX_LABEL}.` };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/ctt/apply/login");

    const path = `ctt/${user.id}/resume.pdf`;
    const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });

    if (uploadError) {
        console.error("[ctt dashboard] resume upload failed:", uploadError);
        return { error: "Could not upload your resume. Please try again." };
    }

    const { error: updateError } = await updateRow(supabase, "ctt_profiles", user.id, {
        resume_path: path,
    });
    if (updateError) {
        console.error("[ctt dashboard] resume_path update failed:", updateError);
        return { error: "Resume uploaded, but we couldn't save it to your profile. Try again." };
    }

    revalidatePath("/ctt/apply/dashboard");
    revalidatePath("/ctt/apply/complete-profile");
    return { success: true };
}

export async function getResumeUrlAction(): Promise<{ url?: string; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/ctt/apply/login");

    const { data: profile } = await supabase
        .from("ctt_profiles")
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
    if (!user) redirect("/ctt/apply/login");

    const admin = createServiceRoleClient();
    await admin.storage.from("resumes").remove([`ctt/${user.id}/resume.pdf`]);
    await admin.auth.admin.deleteUser(user.id);

    try {
        await supabase.auth.signOut();
    } catch {
        // session is already invalid once the underlying user is gone
    }

    redirect("/ctt/apply/login?accountDeleted=1");
}

export async function applyForCttAction(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/ctt/apply/login");

    const now = new Date().toISOString();
    const { data: cycle } = await supabase
        .from("ctt_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CttCycle, { merge: false }>();

    if (!cycle) {
        return; // no open cycle right now
    }

    const college = String(formData.get("college") || "").trim();
    const major = String(formData.get("major") || "").trim();
    const gradYear = String(formData.get("grad_year") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const gender = String(formData.get("gender") || "").trim();
    const priorInternship = formData.get("prior_internship");
    const internshipLinedUp = formData.get("internship_lined_up");

    const extras = parseCttApplicationExtras(formData);

    if (!college || !major || !gradYear || !country || !gender || !priorInternship || !internshipLinedUp || !extras) {
        return; // required fields enforced client-side too; bail quietly if bypassed
    }

    const { error } = await insertRow(supabase, "ctt_applications", {
        cycle_id: cycle.id,
        applicant_type: "external",
        cqg_profile_id: null,
        ctt_profile_id: user.id,
        college,
        major,
        grad_year: gradYear,
        country,
        gender,
        prior_internship: priorInternship === "yes",
        internship_lined_up: internshipLinedUp === "yes",
        internship_location: extras.internshipLocation,
        travel_housing_needed: extras.travelHousingNeeded,
    });

    if (error) {
        console.error("[ctt dashboard] application insert failed:", error);
    }

    revalidatePath("/ctt/apply/dashboard");
}
