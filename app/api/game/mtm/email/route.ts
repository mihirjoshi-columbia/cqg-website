import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { finalPnl, trueValue } from "@/lib/game/mtm/engine";
import { MTM_PRESETS } from "@/lib/game/mtm/presets";
import { replay } from "@/lib/game/mtm/replay";
import { isComplete, open, MtmSessionError } from "@/lib/game/mtm/session";
import { EmailSendError, sendMtmScoreEmail } from "@/lib/email";

/**
 * Emails the hand's score to the fixed coach address.
 *
 * Note what the client does NOT send: the score, and the recipient. The P&L
 * is recomputed here from the sealed session, and the recipient is a
 * server-side constant -- otherwise this would be an open relay for
 * CQG-branded mail. The only thing the client supplies is the token it
 * cannot read or alter.
 */
export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;

    let session;
    try {
        session = open(body?.token);
    } catch (error) {
        if (error instanceof MtmSessionError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        throw error;
    }

    // A half-played hand has no score to report.
    if (!isComplete(session)) {
        return NextResponse.json({ error: "Finish the hand first." }, { status: 409 });
    }

    const state = replay(session.seed, session.preset, session.actions);

    try {
        await sendMtmScoreEmail({
            playerName: gate.profile.name,
            playerEmail: gate.profile.email,
            difficulty: MTM_PRESETS[session.preset].label,
            finalPnl: finalPnl(state),
            trueValue: trueValue(state),
            position: state.position,
            trades: state.trades,
        });
    } catch (error) {
        // lib/email.ts throws on every Resend failure rather than swallowing
        // it, so surface a real message instead of pretending it sent.
        console.error("[mtm] score email failed", error);
        const detail =
            error instanceof EmailSendError ? "Email isn't configured." : "Could not send.";
        return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
}
