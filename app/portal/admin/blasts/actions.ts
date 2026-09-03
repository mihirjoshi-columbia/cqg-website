"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { insertRow } from "@/lib/supabase/helpers";
import { dispatchDueBlasts } from "@/lib/blasts";
import type { BlastSegmentType } from "@/lib/supabase/types";

export interface BlastFormState {
    error?: string;
    success?: boolean;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Plain multi-paragraph text (with {{name}} merge tokens) -> paragraph HTML.
// No rich-text editor in scope — see the plan's UI approach note.
function textToHtml(text: string): string {
    return text
        .split(/\n{2,}/)
        .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
}

export async function createBlastAction(_prev: BlastFormState, formData: FormData): Promise<BlastFormState> {
    const { admin, profile } = await requireAdmin();

    const subject = String(formData.get("subject") || "").trim();
    const bodyText = String(formData.get("body") || "").trim();
    const segmentType = String(formData.get("segment_type") || "") as BlastSegmentType;
    const timing = String(formData.get("timing") || "now");
    const scheduledAtRaw = String(formData.get("scheduled_at") || "");

    if (!subject || !bodyText || !segmentType) {
        return { error: "Subject, body, and a segment are required." };
    }

    let segmentParams: Record<string, unknown> = {};
    if (segmentType === "cqg_tier") {
        segmentParams = { tier: String(formData.get("cqg_tier") || "all") };
    } else if (segmentType === "cutc_group") {
        segmentParams = { status: String(formData.get("cutc_status") || "all") };
    } else if (segmentType === "event_group") {
        const eventId = String(formData.get("event_id") || "");
        if (!eventId) return { error: "Please choose an event." };
        segmentParams = { eventId, which: String(formData.get("event_which") || "applied") };
    } else {
        return { error: "Invalid segment type." };
    }

    let scheduledAt: string;
    if (timing === "schedule") {
        if (!scheduledAtRaw) return { error: "Please choose a date/time to schedule for." };
        scheduledAt = new Date(scheduledAtRaw).toISOString();
    } else {
        scheduledAt = new Date().toISOString();
    }

    const { error } = await insertRow(admin, "email_blasts", {
        subject,
        body_html: textToHtml(bodyText),
        segment_type: segmentType,
        segment_params: segmentParams,
        scheduled_at: scheduledAt,
        created_by: profile.id,
        status: "scheduled",
    });

    if (error) {
        console.error("[admin] create blast failed:", error);
        return { error: "Could not create blast." };
    }

    if (timing === "now") {
        await dispatchDueBlasts();
    }

    revalidatePath("/portal/admin/blasts");
    return { success: true };
}

export async function dispatchNowAction() {
    await requireAdmin();
    await dispatchDueBlasts();
    revalidatePath("/portal/admin/blasts");
}
