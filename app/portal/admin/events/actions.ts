"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { insertRow, updateRow } from "@/lib/supabase/helpers";
import { easternLocalToIso } from "@/lib/events";
import type { CqgEvent, EventEligibility, PromoColor } from "@/lib/supabase/types";

export interface EventFormState {
    error?: string;
    success?: boolean;
}

type EventFields = Pick<
    CqgEvent,
    | "title"
    | "description"
    | "location"
    | "starts_at"
    | "ends_at"
    | "capacity"
    | "instant_rsvp"
    | "promote_on_home"
    | "promo_banner_text"
    | "promo_button_label"
    | "promo_color"
    | "promo_audience"
    | "eligibility"
>;

// Times in the form are Eastern time (the server runs in UTC, so they're converted explicitly).
function parseEventForm(formData: FormData): { fields: EventFields } | { error: string } {
    const title = String(formData.get("title") || "").trim();
    const startsAt = easternLocalToIso(String(formData.get("starts_at") || ""));
    const endsRaw = String(formData.get("ends_at") || "");
    const endsAt = endsRaw ? easternLocalToIso(endsRaw) : null;
    const capacityRaw = String(formData.get("capacity") || "").trim();

    if (!title || !startsAt) return { error: "Title and start time are required." };
    if (endsRaw && !endsAt) return { error: "The end time isn't a valid date." };
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) return { error: "The end time must be after the start time." };

    let capacity: number | null = null;
    if (capacityRaw) {
        const parsed = Number(capacityRaw);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return { error: "Capacity must be a positive whole number, or left blank for unlimited." };
        }
        capacity = parsed;
    }

    const color = String(formData.get("promo_color") || "pink");
    const eligibility = String(formData.get("eligibility") || "all");
    if (!["pink", "lime", "sky"].includes(color)) return { error: "Pick a banner color." };
    if (!["all", "undergraduate", "graduate"].includes(eligibility)) return { error: "Pick who the event is open to." };

    const blankToNull = (key: string) => String(formData.get(key) || "").trim() || null;

    return {
        fields: {
            title,
            description: String(formData.get("description") || "").trim(),
            location: String(formData.get("location") || "").trim(),
            starts_at: startsAt,
            ends_at: endsAt,
            capacity,
            instant_rsvp: formData.get("instant_rsvp") === "on",
            promote_on_home: formData.get("promote_on_home") === "on",
            promo_banner_text: blankToNull("promo_banner_text"),
            promo_button_label: blankToNull("promo_button_label"),
            promo_color: color as PromoColor,
            promo_audience: blankToNull("promo_audience"),
            eligibility: eligibility as EventEligibility,
        },
    };
}

// The homepage, public Events page and dashboard all read promoted events, so refresh them at once.
function revalidateEventPages(eventId?: string) {
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/events");
    revalidatePath("/portal/admin/events");
    if (eventId) revalidatePath(`/portal/admin/events/${eventId}`);
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
    const { admin, profile } = await requireAdmin();

    const parsed = parseEventForm(formData);
    if ("error" in parsed) return { error: parsed.error };

    const { error } = await insertRow(admin, "cqg_events", { ...parsed.fields, created_by: profile.id });
    if (error) {
        console.error("[admin] create event failed:", error);
        return { error: "Could not create event." };
    }

    revalidateEventPages();
    return { success: true };
}

export async function updateEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
    const { admin } = await requireAdmin();

    const eventId = String(formData.get("event_id") || "");
    if (!eventId) return { error: "Missing event." };
    const parsed = parseEventForm(formData);
    if ("error" in parsed) return { error: parsed.error };

    const { error } = await updateRow(admin, "cqg_events", eventId, parsed.fields);
    if (error) {
        console.error("[admin] update event failed:", error);
        return { error: "Could not save changes." };
    }

    revalidateEventPages(eventId);
    redirect("/portal/admin/events");
}

export async function deleteEventAction(eventId: string) {
    const { admin } = await requireAdmin();
    // RSVPs and applications for the event are removed with it (on delete cascade).
    const { error } = await admin.from("cqg_events").delete().eq("id", eventId);
    if (error) {
        console.error("[admin] delete event failed:", error);
        return { error: "Could not delete the event." };
    }
    revalidateEventPages(eventId);
    return {};
}

export async function toggleEventLockAction(eventId: string, locked: boolean) {
    const { admin } = await requireAdmin();
    const { error } = await updateRow(admin, "cqg_events", eventId, { applications_locked: locked });
    if (error) {
        console.error("[admin] toggle event lock failed:", error);
    }
    // Locking RSVPs also takes the event off the homepage.
    revalidateEventPages(eventId);
}
