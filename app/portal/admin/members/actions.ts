"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { updateRow } from "@/lib/supabase/helpers";
import type { CqgTier } from "@/lib/supabase/types";

export interface TierUpdateState {
    error?: string;
    success?: boolean;
}

const VALID_TIERS: CqgTier[] = ["general_body", "member", "admin"];

export async function updateMemberTierAction(
    _prev: TierUpdateState,
    formData: FormData
): Promise<TierUpdateState> {
    const { admin } = await requireAdmin();
    const profileId = String(formData.get("profileId") || "");
    const tier = String(formData.get("tier") || "") as CqgTier;

    if (!profileId || !VALID_TIERS.includes(tier)) {
        return { error: "Invalid request." };
    }

    const { error } = await updateRow(admin, "cqg_profiles", profileId, { tier });
    if (error) {
        console.error("[admin] tier update failed:", error);
        return { error: "Could not update tier." };
    }

    revalidatePath("/portal/admin/members");
    return { success: true };
}

export async function getMemberResumeUrlAction(
    profileId: string
): Promise<{ url?: string; error?: string }> {
    const { admin } = await requireAdmin();

    const { data: profile } = await admin
        .from("cqg_profiles")
        .select("resume_path")
        .eq("id", profileId)
        .maybeSingle()
        .overrideTypes<{ resume_path: string | null }, { merge: false }>();

    if (!profile?.resume_path) {
        return { error: "No resume on file." };
    }

    const { data, error } = await admin.storage.from("resumes").createSignedUrl(profile.resume_path, 60);
    if (error || !data) {
        return { error: "Could not generate a link." };
    }

    return { url: data.signedUrl };
}
