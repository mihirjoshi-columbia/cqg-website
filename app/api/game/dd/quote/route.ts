import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { replay } from "@/lib/game/dd/replay";
import {
    DdSessionError,
    isComplete,
    open,
    seal,
    totalQuotes,
    withQuote,
} from "@/lib/game/dd/session";
import { projectRun } from "@/lib/game/dd/project";
import { DdQuoteError, validateQuote } from "@/lib/game/dd/engine";
import { score } from "@/lib/game/dd/scoring";
import {
    DdContestError,
    completeAttempt,
    loadContest,
} from "@/lib/game/dd/contests";
import type { Json } from "@/lib/supabase/types";

export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as {
        token?: unknown;
        index?: unknown;
        bid?: unknown;
        ask?: unknown;
    } | null;

    // Validated before the session is opened; none of it is trusted.
    const index = body?.index;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
        return NextResponse.json({ error: "Bad quote index." }, { status: 400 });
    }
    if (typeof body?.bid !== "number" || typeof body?.ask !== "number") {
        return NextResponse.json({ error: "A quote needs a bid and an ask." }, { status: 400 });
    }

    try {
        // Any edit to the token fails the GCM auth tag here.
        const session = open(body.token);
        if (index >= totalQuotes(session)) {
            return NextResponse.json({ error: "Bad quote index." }, { status: 400 });
        }

        const quote = validateQuote({ bid: body.bid, ask: body.ask });
        const { session: next, lateQuote } = withQuote(session, index, quote);
        const run = replay(next.seeds, next.preset, next.quotes);
        const finished = isComplete(next);

        // A contest result is derived here, from a server-side replay of the
        // seeds and quotes. The client never sends a score and is never asked
        // to; it could not produce one that would be believed.
        if (finished && next.contestSlug) {
            const contest = await loadContest(next.contestSlug);
            const breakdown = score(run);
            await completeAttempt(
                contest,
                gate.profile.id,
                breakdown.totalPnl,
                breakdown as unknown as Json,
                next.quotes as unknown as Json
            );
        }

        return NextResponse.json({
            run: projectRun(run),
            token: seal(next),
            lateQuote,
        });
    } catch (error) {
        if (error instanceof DdContestError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof DdSessionError || error instanceof DdQuoteError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("[dd] quote failed", error);
        return NextResponse.json({ error: "That quote was rejected." }, { status: 409 });
    }
}
