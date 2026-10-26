import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
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
        contestSlug?: unknown;
    } | null;

    // There is no ungraded mode. Every run belongs to a contest, which is
    // what makes it an attempt that can be recorded.
    const slug = body?.contestSlug;
    if (typeof slug !== "string" || slug.length === 0) {
        return NextResponse.json({ error: "Bad contest." }, { status: 400 });
    }

    try {
        // The contest names its own preset; the client never chooses one.
        const contest = await loadContest(slug);
        const preset = presetForContest(contest);

        // Spends one attempt now, so abandoning the run cannot be retried.
        const attemptId = await openAttempt(contest, gate.profile.id);

        const session = createSession(preset, contest.slug, attemptId);
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
