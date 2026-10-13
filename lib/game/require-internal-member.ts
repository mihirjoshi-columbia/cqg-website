import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CqgProfile } from "@/lib/supabase/types";

export type InternalMemberGate =
    | { ok: true; profile: CqgProfile }
    | { ok: false; status: 401 | 403; message: string };

/**
 * Non-redirecting tier check, for route handlers.
 *
 * Route handlers are directly callable, so they cannot rely on a page having
 * hidden a button -- the same reasoning lib/admin.ts gives for re-checking
 * admin status inside every admin Server Action.
 */
export async function checkInternalMember(): Promise<InternalMemberGate> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, status: 401, message: "Not signed in." };

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    if (!profile) return { ok: false, status: 401, message: "No CQG profile." };
    if (profile.tier !== "member" && profile.tier !== "admin") {
        return { ok: false, status: 403, message: "Internal Members only." };
    }
    return { ok: true, profile };
}

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
