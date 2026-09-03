"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { updateRow } from "@/lib/supabase/helpers";

export async function decideCutcApplicationAction(formData: FormData) {
    const { admin, profile } = await requireAdmin();
    const applicationId = String(formData.get("applicationId") || "");
    const decision = String(formData.get("decision") || "");

    if (!applicationId || (decision !== "approve" && decision !== "reject")) {
        return;
    }

    const { error } = await updateRow(admin, "cutc_applications", applicationId, {
        status: decision === "approve" ? "approved" : "rejected",
        decided_at: new Date().toISOString(),
        decided_by: profile.id,
    });

    if (error) {
        console.error("[admin] cutc application decision failed:", error);
    }

    revalidatePath("/portal/admin/applications/cutc");
}

export async function getApplicantResumeUrlAction(
    applicantType: "cqg_member" | "external",
    cqgProfileId: string | null,
    cutcProfileId: string | null
): Promise<{ url?: string; error?: string }> {
    const { admin } = await requireAdmin();

    const id = applicantType === "cqg_member" ? cqgProfileId : cutcProfileId;
    if (!id) return { error: "No applicant." };

    const { data: profile } =
        applicantType === "cqg_member"
            ? await admin
                  .from("cqg_profiles")
                  .select("resume_path")
                  .eq("id", id)
                  .maybeSingle()
                  .overrideTypes<{ resume_path: string | null }, { merge: false }>()
            : await admin
                  .from("cutc_profiles")
                  .select("resume_path")
                  .eq("id", id)
                  .maybeSingle()
                  .overrideTypes<{ resume_path: string | null }, { merge: false }>();

    if (!profile?.resume_path) return { error: "No resume on file." };

    const { data, error } = await admin.storage.from("resumes").createSignedUrl(profile.resume_path, 60);
    if (error || !data) return { error: "Could not generate a link." };
    return { url: data.signedUrl };
}
