"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { callRpc } from "@/lib/supabase/helpers";

// These call the SECURITY DEFINER RPC functions from supabase/migrations/0001,
// which check `is_admin()` internally against `auth.uid()` — that only
// resolves correctly when called via the admin's own authenticated session
// (`supabase`), not the service-role client (`admin`), which has no
// request-scoped user identity for auth.uid() to read.

export async function decideEventApplicationAction(applicationId: string, approve: boolean, eventId: string) {
    const { supabase } = await requireAdmin();
    const { error } = await callRpc(supabase, "cqg_event_decide", {
        p_application_id: applicationId,
        p_approve: approve,
    });
    if (error) {
        console.error("[admin] event application decision failed:", error);
    }
    revalidatePath(`/portal/admin/events/${eventId}`);
}

export async function setEventAttendanceAction(applicationId: string, attended: boolean, eventId: string) {
    const { supabase } = await requireAdmin();
    const { error } = await callRpc(supabase, "cqg_event_set_attendance", {
        p_application_id: applicationId,
        p_attended: attended,
    });
    if (error) {
        console.error("[admin] set attendance failed:", error);
    }
    revalidatePath(`/portal/admin/events/${eventId}`);
}
