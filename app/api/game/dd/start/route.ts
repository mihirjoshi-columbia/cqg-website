import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { isDdPreset } from "@/lib/game/dd/presets";
import { createSession, seal, DdSessionError } from "@/lib/game/dd/session";
import { replay } from "@/lib/game/dd/replay";
import { projectRun } from "@/lib/game/dd/project";
import {
    DdContestError,
    loadContest,
    openAttempt,
    presetForContest,
} from "@/lib/game/dd/contests";

export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as {
        preset?: unknown;
        contestSlug?: unknown;
    } | null;

    const slug = body?.contestSlug;
    if (slug !== undefined && typeof slug !== "string") {
        return NextResponse.json({ error: "Bad contest." }, { status: 400 });
    }

    try {
        // A contest names its own preset. The client cannot choose one for a
        // ranked run, or it could play the forgiving practice settings and
        // land on the midpoint leaderboard.
        let preset;
        let contestSlug: string | null = null;

        if (typeof slug === "string") {
            const contest = await loadContest(slug);
            preset = presetForContest(contest);
            // Burns the attempt now, so abandoning the run cannot be retried.
            await openAttempt(contest, gate.profile.id);
            contestSlug = contest.slug;
        } else {
            if (!isDdPreset(body?.preset)) {
                return NextResponse.json({ error: "Unknown difficulty." }, { status: 400 });
            }
            if (body.preset !== "practice") {
                return NextResponse.json(
                    { error: "That mode is only playable as a contest." },
                    { status: 403 }
                );
            }
            preset = body.preset;
        }

        const session = createSession(preset, contestSlug);
        const run = replay(session.seeds, preset, []);
        return NextResponse.json({ run: projectRun(run), token: seal(session) });
    } catch (error) {
        if (error instanceof DdContestError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof DdSessionError) {
            console.error("[dd] session config error", error);
            return NextResponse.json({ error: "The game is not configured." }, { status: 500 });
        }
        console.error("[dd] start failed", error);
        return NextResponse.json({ error: "Could not deal a run." }, { status: 500 });
    }
}
