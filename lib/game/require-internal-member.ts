import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CqgProfile } from "@/lib/supabase/types";

/**
 * Page-level gate. Mirrors requireAdmin() in lib/admin.ts, including the
 * complete-profile redirect every other portal page applies.
 *
 * A general_body member is NOT redirected -- the caller gets the profile back
 * so the page can explain that the game is Internal-Members-only rather than
 * bouncing them somewhere with no explanation.
 */
export async function requireSignedInMember() {
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

    if (!profile) redirect("/portal/login");
    if (!profile.resume_path) redirect("/portal/complete-profile");

    return {
        supabase,
        profile,
        isInternal: profile.tier === "member" || profile.tier === "admin",
    };
}
