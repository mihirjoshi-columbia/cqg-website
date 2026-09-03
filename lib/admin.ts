import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { CqgProfile } from "@/lib/supabase/types";

// Re-verifies admin status server-side — used both by the admin layout (to
// gate the whole section) and independently inside every admin Server
// Action, since actions are directly callable and can't rely on the UI
// having hidden the button from a non-admin. Returns a service-role client
// for the actual privileged mutation: cqg_profiles' tier-change trigger only
// lets service_role through, by design (see supabase/migrations/0001 and
// 0003) — a plain admin session client would be blocked from changing
// someone else's tier the same as anyone else.
export async function requireAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    if (!profile || profile.tier !== "admin") {
        redirect("/portal/dashboard");
    }

    return { supabase, profile, admin: createServiceRoleClient() };
}
