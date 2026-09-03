"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/helpers";

export async function applyToEventAction(eventId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { error } = await callRpc(supabase, "cqg_event_apply", { p_event_id: eventId });
    if (error) {
        console.error("[events] apply failed:", error);
    }
    revalidatePath("/portal/events");
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
