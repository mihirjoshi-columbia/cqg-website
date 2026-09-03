"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { insertRow, updateRow } from "@/lib/supabase/helpers";

export interface EventFormState {
    error?: string;
    success?: boolean;
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
    const { admin, profile } = await requireAdmin();

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const startsAt = String(formData.get("starts_at") || "");
    const endsAt = String(formData.get("ends_at") || "");
    const capacityRaw = String(formData.get("capacity") || "").trim();

    if (!title || !startsAt) {
        return { error: "Title and start time are required." };
    }

    let capacity: number | null = null;
    if (capacityRaw) {
        const parsed = Number(capacityRaw);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return { error: "Capacity must be a positive whole number, or left blank for unlimited." };
        }
        capacity = parsed;
    }

    const { error } = await insertRow(admin, "cqg_events", {
        title,
        description,
        location,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        capacity,
        created_by: profile.id,
    });

    if (error) {
        console.error("[admin] create event failed:", error);
        return { error: "Could not create event." };
    }

    revalidatePath("/portal/admin/events");
    return { success: true };
}

export async function toggleEventLockAction(eventId: string, locked: boolean) {
    const { admin } = await requireAdmin();
    const { error } = await updateRow(admin, "cqg_events", eventId, { applications_locked: locked });
    if (error) {
        console.error("[admin] toggle event lock failed:", error);
    }
    revalidatePath("/portal/admin/events");
    revalidatePath(`/portal/admin/events/${eventId}`);
}
