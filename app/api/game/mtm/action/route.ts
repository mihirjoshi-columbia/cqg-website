import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { isMtmAction, MTM_TOTAL_ACTIONS, replay } from "@/lib/game/mtm/replay";
import { isComplete, open, seal, withAction, MtmSessionError } from "@/lib/game/mtm/session";
import { projectSettled, projectState } from "@/lib/game/mtm/project";

export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as {
        token?: unknown;
        index?: unknown;
        action?: unknown;
    } | null;

    const index = body?.index;
    const action = body?.action;

    // Validated before the session is opened; none of it is trusted.
    if (
        typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= MTM_TOTAL_ACTIONS
    ) {
        return NextResponse.json({ error: "Bad action index." }, { status: 400 });
    }
    if (!isMtmAction(action)) {
        return NextResponse.json({ error: "Bad action." }, { status: 400 });
    }

    try {
        // Any edit to the token fails the GCM auth tag here.
        const next = withAction(open(body?.token), index, action);
        const state = replay(next.seed, next.preset, next.actions);
        return NextResponse.json({
            state: isComplete(next)
                ? projectSettled(state, next.preset)
                : projectState(state, next.preset),
            token: seal(next),
        });
    } catch (error) {
        if (error instanceof MtmSessionError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("[mtm] action failed", error);
        return NextResponse.json({ error: "That move was rejected." }, { status: 409 });
    }
}
