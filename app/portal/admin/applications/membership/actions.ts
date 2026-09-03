"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { updateRow } from "@/lib/supabase/helpers";

export async function decideMembershipApplicationAction(formData: FormData) {
    const { admin, profile } = await requireAdmin();
    const applicationId = String(formData.get("applicationId") || "");
    const decision = String(formData.get("decision") || "");
    const applicantId = String(formData.get("applicantId") || "");

    if (!applicationId || !applicantId || (decision !== "approve" && decision !== "reject")) {
        return;
    }

    const { error } = await updateRow(admin, "cqg_membership_applications", applicationId, {
        status: decision === "approve" ? "approved" : "rejected",
        decided_at: new Date().toISOString(),
        decided_by: profile.id,
    });

    if (error) {
        console.error("[admin] membership application decision failed:", error);
        return;
    }

    if (decision === "approve") {
        const { error: tierError } = await updateRow(admin, "cqg_profiles", applicantId, { tier: "member" });
        if (tierError) {
            console.error("[admin] tier promotion after approval failed:", tierError);
        }
    }

    revalidatePath("/portal/admin/applications/membership");
    revalidatePath("/portal/admin/members");
}
