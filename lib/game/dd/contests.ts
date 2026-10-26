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

/** Every attempt this person has made at this contest, oldest first. */
export async function listAttempts(
    contestId: string,
    profileId: string
): Promise<CqgGameAttempt[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from("cqg_game_attempts")
        .select("*")
        .eq("contest_id", contestId)
        .eq("profile_id", profileId)
        .order("attempt_number", { ascending: true })
        .overrideTypes<CqgGameAttempt[], { merge: false }>();

    if (error) throw new DdContestError("Could not check your attempts.", 500);
    return data ?? [];
}

export interface AttemptSummary {
    used: number;
    allowed: number;
    remaining: number;
    /** Highest score among completed attempts, or null if none finished. */
    bestScore: number | null;
}

export function summarise(contest: CqgGameContest, attempts: CqgGameAttempt[]): AttemptSummary {
    const scores = attempts
        .filter((a) => a.completed_at !== null && a.score !== null)
        .map((a) => Number(a.score));

    return {
        used: attempts.length,
        allowed: contest.attempts_allowed,
        remaining: Math.max(0, contest.attempts_allowed - attempts.length),
        bestScore: scores.length ? Math.max(...scores) : null,
    };
}

/**
 * Records that a run has been DEALT, and returns the attempt's id.
 *
 * Writing at deal time rather than at submit is the whole reason the table
 * exists: the sealed-token design is stateless, so without this a player
 * could abandon a run and deal again until they liked the result -- exactly
 * the hole lib/game/mtm/session.ts documents about itself. Several attempts
 * are allowed, but each one is spent the moment it is dealt.
 */
export async function openAttempt(
    contest: CqgGameContest,
    profileId: string
): Promise<string> {
    const now = Date.now();
    if (now < Date.parse(contest.opens_at)) {
        throw new DdContestError("This has not opened yet.", 403);
    }
    if (now > Date.parse(contest.closes_at)) {
        throw new DdContestError("This has closed.", 403);
    }

    const attempts = await listAttempts(contest.id, profileId);
    if (attempts.length >= contest.attempts_allowed) {
        throw new DdContestError(
            `You have used all ${contest.attempts_allowed} of your attempts.`,
            409
        );
    }

    const attemptNumber = attempts.length + 1;
    const { error } = await insertRow(createServiceRoleClient(), "cqg_game_attempts", {
        contest_id: contest.id,
        profile_id: profileId,
        attempt_number: attemptNumber,
    });

    if (error) {
        // The unique (contest_id, profile_id, attempt_number) index is the
        // real guard: two tabs racing both compute the same next number, and
        // exactly one insert survives.
        if (error.code === "23505") {
            throw new DdContestError(
                "Another tab just started an attempt. Reload before starting again.",
                409
            );
        }
        throw new DdContestError("Could not start that run.", 500);
    }

    const after = await listAttempts(contest.id, profileId);
    const created = after.find((a) => a.attempt_number === attemptNumber);
    if (!created) throw new DdContestError("Could not start that run.", 500);
    return created.id;
}

/**
 * Records a finished run. `score` and `breakdown` are always recomputed by the
 * caller from a server-side replay -- never accepted from the client -- and
 * the quotes are stored so any result can be re-derived later.
 *
 * Targets one attempt by id, carried in the sealed session token, so a run
 * can never write its result over a different attempt's.
 */
export async function completeAttempt(
    attemptId: string,
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
        .eq("id", attemptId)
        // Ownership is re-checked here rather than assumed from the token.
        .eq("profile_id", profileId)
        .is("completed_at", null);

    if (error) throw new DdContestError("Could not record your result.", 500);
}
