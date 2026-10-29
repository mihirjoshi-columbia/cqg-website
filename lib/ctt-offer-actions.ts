"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/helpers";

// The applicant answers their own offer. All the checks (ownership, still "offered", the 24-hour
// deadline) live in the respond_ctt_offer database function, so this can't be used to answer
// someone else's offer or to answer late. Returns the status the application ended up in.
export async function respondToCttOfferAction(
    applicationId: string,
    accept: boolean
): Promise<{ status?: string; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please log in again." };

    const { data, error } = await callRpc(supabase, "respond_ctt_offer", {
        p_application_id: applicationId,
        p_accept: accept,
    });
    if (error) {
        console.error("[ctt offer] respond failed:", error);
        return { error: "Something went wrong. Please try again." };
    }

    revalidatePath("/portal/dashboard");
    revalidatePath("/ctt/apply/dashboard");
    return { status: data ?? undefined };
}
