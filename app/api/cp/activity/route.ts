import { NextResponse } from "next/server";
import { checkInternalMember } from "@/lib/game/require-internal-member";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertRow } from "@/lib/supabase/helpers";
import type { Database } from "@/lib/supabase/types";
import { findProblem } from "@/lib/cp/problems";
import type { CqgCpActivity } from "@/lib/supabase/types";

const KINDS = new Set<CqgCpActivity["kind"]>(["started", "accepted", "wrong", "runtime", "timeout", "compile"]);

/**
 * Logs a page open or a submission for the live admin board. The verdict is
 * whatever the member's browser judged -- see migration 0020 for why that is
 * acceptable here and nowhere graded.
 */
export async function POST(request: Request) {
    const gate = await checkInternalMember();
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    const body = (await request.json().catch(() => null)) as {
        kind?: unknown;
        problemId?: unknown;
        language?: unknown;
        failedTest?: unknown;
    } | null;

    const kind = body?.kind as CqgCpActivity["kind"];
    if (!KINDS.has(kind)) return NextResponse.json({ error: "Bad kind." }, { status: 400 });

    if (kind === "started") return record({ profile_id: gate.profile.id, kind });

    const problemId = body?.problemId;
    const language = body?.language;
    if (typeof problemId !== "string" || !findProblem(problemId)) {
        return NextResponse.json({ error: "Bad problem." }, { status: 400 });
    }
    if (language !== "python" && language !== "cpp") {
        return NextResponse.json({ error: "Bad language." }, { status: 400 });
    }
    return record({
        profile_id: gate.profile.id,
        kind,
        problem_id: problemId,
        language,
        failed_test: Number.isInteger(body?.failedTest) ? (body?.failedTest as number) : null,
    });
}

async function record(row: Database["public"]["Tables"]["cqg_cp_activity"]["Insert"]) {
    const { error } = await insertRow(createServiceRoleClient(), "cqg_cp_activity", row);
    if (error) return NextResponse.json({ error: "Could not record that." }, { status: 500 });
    return NextResponse.json({ ok: true });
}
