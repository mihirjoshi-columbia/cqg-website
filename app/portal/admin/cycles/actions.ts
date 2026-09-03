"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { insertRow } from "@/lib/supabase/helpers";

export interface CycleFormState {
    error?: string;
    success?: boolean;
}

function parseCycleForm(formData: FormData): { label: string; opensAt: string; closesAt: string } | { error: string } {
    const label = String(formData.get("label") || "").trim();
    const opensAt = String(formData.get("opens_at") || "");
    const closesAt = String(formData.get("closes_at") || "");

    if (!label || !opensAt || !closesAt) {
        return { error: "All fields are required." };
    }
    if (new Date(closesAt) <= new Date(opensAt)) {
        return { error: "Close date must be after open date." };
    }
    return { label, opensAt, closesAt };
}

export async function createMembershipCycleAction(
    _prev: CycleFormState,
    formData: FormData
): Promise<CycleFormState> {
    const { admin, profile } = await requireAdmin();
    const parsed = parseCycleForm(formData);
    if ("error" in parsed) return parsed;

    const { error } = await insertRow(admin, "cqg_membership_cycles", {
        label: parsed.label,
        opens_at: new Date(parsed.opensAt).toISOString(),
        closes_at: new Date(parsed.closesAt).toISOString(),
        created_by: profile.id,
    });

    if (error) {
        console.error("[admin] create membership cycle failed:", error);
        return { error: "Could not create cycle." };
    }

    revalidatePath("/portal/admin/cycles");
    return { success: true };
}

export async function createCutcCycleAction(
    _prev: CycleFormState,
    formData: FormData
): Promise<CycleFormState> {
    const { admin, profile } = await requireAdmin();
    const parsed = parseCycleForm(formData);
    if ("error" in parsed) return parsed;

    const { error } = await insertRow(admin, "cutc_cycles", {
        label: parsed.label,
        opens_at: new Date(parsed.opensAt).toISOString(),
        closes_at: new Date(parsed.closesAt).toISOString(),
        created_by: profile.id,
    });

    if (error) {
        console.error("[admin] create cutc cycle failed:", error);
        return { error: "Could not create cycle." };
    }

    revalidatePath("/portal/admin/cycles");
    return { success: true };
}
