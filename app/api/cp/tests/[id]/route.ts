import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import type { CpTest } from "@/lib/cp/problems";
import bestStreak from "@/lib/cp/tests/best-streak.json";
import diceGame from "@/lib/cp/tests/dice-game.json";
import countDown from "@/lib/cp/tests/count-down.json";
import target from "@/lib/cp/tests/target.json";

// Regenerate with `npm run cp:tests`.
const TESTS: Record<string, CpTest[]> = {
    "best-streak": bestStreak as CpTest[],
    "dice-game": diceGame as CpTest[],
    "count-down": countDown as CpTest[],
    target: target as CpTest[],
};

/**
 * The judge runs in the member's browser, so it needs the expected outputs.
 * This keeps them off the public internet; it cannot keep them from a member
 * who opens dev tools, and does not try to -- nothing is scored or stored.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const { id } = await params;
    const tests = TESTS[id];
    if (!tests) return NextResponse.json({ error: "No such problem." }, { status: 404 });
    return NextResponse.json({ tests });
}
