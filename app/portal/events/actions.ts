"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/helpers";
import { sendQuantFairRsvpEmail } from "@/lib/email";
import { isQuantFairEvent } from "@/lib/quant-fair";

export async function applyToEventAction(eventId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { error } = await callRpc(supabase, "cqg_event_apply", { p_event_id: eventId });
    if (error) {
        console.error("[events] apply failed:", error);
    } else {
        await sendQuantFairConfirmation(supabase, eventId, user.id);
    }
    revalidatePath("/portal/events");
    revalidatePath("/portal/dashboard");
}

// Quant Fair RSVPs get a confirmation email. A failed email never undoes the RSVP.
async function sendQuantFairConfirmation(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
    try {
        const { data: event } = await supabase.from("cqg_events").select("title").eq("id", eventId).maybeSingle().overrideTypes<{ title: string }, { merge: false }>();
        if (!event || !isQuantFairEvent(event.title)) return;
        const { data: application } = await supabase
            .from("cqg_event_applications")
            .select("status")
            .eq("event_id", eventId)
            .eq("profile_id", userId)
            .maybeSingle()
            .overrideTypes<{ status: string }, { merge: false }>();
        if (application?.status !== "accepted") return;
        const { data: profile } = await supabase
            .from("cqg_profiles")
            .select("name,email")
            .eq("id", userId)
            .maybeSingle()
            .overrideTypes<{ name: string; email: string }, { merge: false }>();
        if (profile?.email) await sendQuantFairRsvpEmail(profile.email, profile.name);
    } catch (err) {
        console.error("[events] quant fair confirmation email failed:", err);
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
