"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/helpers";
import { sendEventRsvpEmail } from "@/lib/email";

export interface ApplyResult {
    error?: string;
}

export async function applyToEventAction(eventId: string): Promise<ApplyResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { error } = await callRpc(supabase, "cqg_event_apply", { p_event_id: eventId });
    if (error) {
        console.error("[events] apply failed:", error);
        // Only the eligibility messages written in the database function are shown as-is.
        const message = typeof error.message === "string" ? error.message : "";
        return {
            error: message.startsWith("eligibility:")
                ? message.slice("eligibility:".length).trim()
                : "Something went wrong saving your RSVP. Please try again.",
        };
    }

    await sendRsvpConfirmation(supabase, eventId, user.id);
    revalidatePath("/portal/events");
    revalidatePath("/portal/dashboard");
    return {};
}

// Every confirmed RSVP gets a confirmation email. A failed email never undoes the RSVP.
async function sendRsvpConfirmation(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
    try {
        const { data: application } = await supabase
            .from("cqg_event_applications")
            .select("status")
            .eq("event_id", eventId)
            .eq("profile_id", userId)
            .maybeSingle()
            .overrideTypes<{ status: string }, { merge: false }>();
        if (application?.status !== "accepted") return;
        const { data: event } = await supabase
            .from("cqg_events")
            .select("title,starts_at,ends_at,location")
            .eq("id", eventId)
            .maybeSingle()
            .overrideTypes<{ title: string; starts_at: string; ends_at: string | null; location: string }, { merge: false }>();
        if (!event) return;
        const { data: profile } = await supabase
            .from("cqg_profiles")
            .select("name,email")
            .eq("id", userId)
            .maybeSingle()
            .overrideTypes<{ name: string; email: string }, { merge: false }>();
        if (profile?.email) {
            await sendEventRsvpEmail(profile.email, profile.name, {
                title: event.title,
                startsAt: event.starts_at,
                endsAt: event.ends_at,
                location: event.location,
            });
        }
    } catch (err) {
        console.error("[events] RSVP confirmation email failed:", err);
    }
}

export async function withdrawFromEventAction(applicationId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { error } = await callRpc(supabase, "cqg_event_withdraw", { p_application_id: applicationId });
    if (error) {
        console.error("[events] withdraw failed:", error);
    }
    revalidatePath("/portal/events");
}
