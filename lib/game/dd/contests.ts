import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow } from "@/lib/supabase/helpers";
import type { CqgGameAttempt, CqgGameContest, Json } from "@/lib/supabase/types";
import { isDdPreset, type DdPreset } from "./presets";

// Contest bookkeeping for Distribution Desk.
//
// Everything here uses the SERVICE-ROLE client, so every function must do its
// own authorisation. Callers are route handlers that have already run
// checkInternalMember(); these functions are passed the profile id and never
// read it from the request.

export class DdContestError extends Error {
    readonly status: number;
    constructor(message: string, status = 409) {
        super(message);
        this.name = "DdContestError";
        this.status = status;
    }
}

export async function loadContest(slug: string): Promise<CqgGameContest> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from("cqg_game_contests")
        .select("*")
        .eq("slug", slug)
        .maybeSingle<CqgGameContest>();

    if (error) throw new DdContestError("Could not load that contest.", 500);
    if (!data) throw new DdContestError("Unknown contest.", 404);
    return data;
}

export function presetForContest(contest: CqgGameContest): DdPreset {
    if (!isDdPreset(contest.preset)) {
        throw new DdContestError("That contest is misconfigured.", 500);
    }
    return contest.preset;
}

export async function findAttempt(
    contestId: string,
    profileId: string
): Promise<CqgGameAttempt | null> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from("cqg_game_attempts")
        .select("*")
        .eq("contest_id", contestId)
        .eq("profile_id", profileId)
        .maybeSingle<CqgGameAttempt>();

    if (error) throw new DdContestError("Could not check your attempt.", 500);
    return data;
}

/**
 * Records that a run has been DEALT.
 *
 * This is the whole reason the table exists. The sealed-token design is
 * stateless, so without a row written here a player could abandon a run and
 * deal again until they liked the result -- exactly the hole
 * lib/game/mtm/session.ts documents about itself. Writing at deal time means
 * walking away costs the attempt.
 */
export async function openAttempt(contest: CqgGameContest, profileId: string): Promise<void> {
    const now = Date.now();
    if (now < Date.parse(contest.opens_at)) {
        throw new DdContestError("That contest has not opened yet.", 403);
    }
    if (now > Date.parse(contest.closes_at)) {
        throw new DdContestError("That contest has closed.", 403);
    }

    const existing = await findAttempt(contest.id, profileId);
    if (existing) {
        throw new DdContestError(
            existing.completed_at
                ? "You have already completed this contest."
                : "You already started this contest, and it allows one attempt.",
            409
        );
    }

    const { error } = await insertRow(createServiceRoleClient(), "cqg_game_attempts", {
        contest_id: contest.id,
        profile_id: profileId,
    });

    if (error) {
        // The unique (contest_id, profile_id) index is the real guard: two
        // tabs racing both pass the check above, and exactly one insert wins.
        if (error.code === "23505") {
            throw new DdContestError("You have already started this contest.", 409);
        }
        throw new DdContestError("Could not start that contest.", 500);
    }
}

/**
 * Records a finished run. `score` and `breakdown` are always recomputed by the
 * caller from a server-side replay -- never accepted from the client -- and
 * the quotes are stored so any result can be re-derived later.
 */
export async function completeAttempt(
    contest: CqgGameContest,
    profileId: string,
    score: number,
    breakdown: Json,
    quotes: Json
): Promise<void> {
    const supabase = createServiceRoleClient();
    // Cast for the same upstream inference bug lib/supabase/helpers.ts
    // documents; updateRow() is not used here because the write has to be
    // guarded on completed_at being null, so a replayed submit cannot
    // overwrite a score that is already recorded.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("cqg_game_attempts") as any)
        .update({
            completed_at: new Date().toISOString(),
            score,
            breakdown,
            quotes,
        })
        .eq("contest_id", contest.id)
        .eq("profile_id", profileId)
        .is("completed_at", null);

    if (error) throw new DdContestError("Could not record your result.", 500);
}
