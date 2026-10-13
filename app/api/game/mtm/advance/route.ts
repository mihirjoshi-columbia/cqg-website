import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { replay } from "@/lib/game/mtm/replay";
import { open, seal, MtmSessionError } from "@/lib/game/mtm/session";
import { projectState } from "@/lib/game/mtm/project";

/**
 * Turns over the next community card for a round that is already answered.
 * Carries nothing new -- the flip is derivable from the action count -- so it
 * is idempotent and safe to double-click.
 */
export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;

    try {
        const session = open(body?.token);
        const state = replay(session.seed, session.preset, session.actions, {
            advanceCompletedRound: true,
        });
        return NextResponse.json({
            state: projectState(state, session.preset),
            token: seal(session),
        });
    } catch (error) {
        if (error instanceof MtmSessionError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("[mtm] advance failed", error);
        return NextResponse.json({ error: "Could not turn the card." }, { status: 409 });
    }
}
