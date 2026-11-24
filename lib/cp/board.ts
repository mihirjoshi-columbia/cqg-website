// Turns the cqg_cp_activity log into the live admin board's rows.
//
// ICPC-style: rank by problems solved, then by total time, where a problem's
// time is minutes from the member's first activity in the window to their
// first accepted submission. Failed tries before that are counted and shown
// but carry no penalty -- this is practice, and a penalty would reward not
// submitting.
import type { CqgCpActivity } from "@/lib/supabase/types";

export interface BoardCell {
    /** Minutes from the member's start to their first accept, or null. */
    solvedAfterMin: number | null;
    /** Failed submissions (before the accept, if any). */
    failures: number;
    lastVerdict: CqgCpActivity["kind"] | null;
    language: "python" | "cpp" | null;
}

export interface BoardRow {
    profileId: string;
    startedAt: string;
    lastActiveAt: string;
    solved: number;
    totalMin: number;
    cells: Record<string, BoardCell>;
}

export function buildBoard(activity: CqgCpActivity[], problemIds: string[]): BoardRow[] {
    const sorted = [...activity].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const rows = new Map<string, BoardRow>();

    for (const event of sorted) {
        let row = rows.get(event.profile_id);
        if (!row) {
            row = {
                profileId: event.profile_id,
                startedAt: event.created_at,
                lastActiveAt: event.created_at,
                solved: 0,
                totalMin: 0,
                cells: Object.fromEntries(
                    problemIds.map((id) => [
                        id,
                        { solvedAfterMin: null, failures: 0, lastVerdict: null, language: null },
                    ]),
                ),
            };
            rows.set(event.profile_id, row);
        }
        row.lastActiveAt = event.created_at;

        const cell = event.problem_id ? row.cells[event.problem_id] : undefined;
        // Anything after the first accept is replaying a solved problem.
        if (!cell || cell.solvedAfterMin !== null) continue;

        cell.lastVerdict = event.kind;
        cell.language = event.language;
        if (event.kind === "accepted") {
            const minutes = Math.floor(
                (Date.parse(event.created_at) - Date.parse(row.startedAt)) / 60000,
            );
            cell.solvedAfterMin = minutes;
            row.solved += 1;
            row.totalMin += minutes;
        } else {
            cell.failures += 1;
        }
    }

    return [...rows.values()].sort(
        (a, b) => b.solved - a.solved || a.totalMin - b.totalMin || a.startedAt.localeCompare(b.startedAt),
    );
}
