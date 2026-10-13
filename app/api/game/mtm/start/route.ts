import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { isMtmPreset } from "@/lib/game/mtm/presets";
import { createSession, seal, MtmSessionError } from "@/lib/game/mtm/session";
import { replay } from "@/lib/game/mtm/replay";
import { projectState } from "@/lib/game/mtm/project";

export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = await request.json().catch(() => null);
    const preset = (body as { preset?: unknown } | null)?.preset;
    // The client names a preset, never a Config -- otherwise it could play
    // with the fair-value estimate switched on while reporting Expert.
    if (!isMtmPreset(preset)) {
        return NextResponse.json({ error: "Unknown difficulty." }, { status: 400 });
    }

    try {
        const session = createSession(preset);
        const state = replay(session.seed, preset, []);
        return NextResponse.json({ state: projectState(state, preset), token: seal(session) });
    } catch (error) {
        if (error instanceof MtmSessionError) {
            console.error("[mtm] session config error", error);
            return NextResponse.json({ error: "The game is not configured." }, { status: 500 });
        }
        console.error("[mtm] start failed", error);
        return NextResponse.json({ error: "Could not deal a hand." }, { status: 500 });
    }
}
