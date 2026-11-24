import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchAllPages } from "@/lib/supabase/helpers";
import { CP_PROBLEMS } from "@/lib/cp/problems";
import { buildBoard, type BoardCell } from "@/lib/cp/board";
import type { CqgCpActivity } from "@/lib/supabase/types";
import LiveRefresh from "./LiveRefresh";

export const metadata = { title: "Competitive Programming — CQG Admin" };

const WINDOWS = {
    "3h": { label: "Last 3 hours", hours: 3 },
    "24h": { label: "Last 24 hours", hours: 24 },
    "7d": { label: "Last 7 days", hours: 24 * 7 },
    all: { label: "All time", hours: null },
} as const;
type WindowKey = keyof typeof WINDOWS;

const SHORT: Record<CqgCpActivity["kind"], string> = {
    started: "",
    accepted: "AC",
    wrong: "WA",
    runtime: "RE",
    timeout: "TLE",
    compile: "CE",
};

// Clock reads live in helpers rather than the component body, matching
// app/portal/admin/cycles/page.tsx.
function windowStart(hours: number | null): string | null {
    return hours === null ? null : new Date(Date.now() - hours * 3600_000).toISOString();
}

function time(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Cell({ cell }: { cell: BoardCell }) {
    if (cell.solvedAfterMin !== null) {
        return (
            <div className="flex flex-col items-center leading-tight">
                <span className="font-bold text-navy">✓ {cell.solvedAfterMin}m</span>
                <span className="text-ink-faint text-[0.7rem] font-mono">
                    {cell.language === "cpp" ? "C++" : "Py"}
                    {cell.failures > 0 && ` · ${cell.failures} miss${cell.failures === 1 ? "" : "es"}`}
                </span>
            </div>
        );
    }
    if (cell.failures > 0) {
        return (
            <div className="flex flex-col items-center leading-tight">
                <span className="font-bold text-pink-deep">−{cell.failures}</span>
                <span className="text-ink-faint text-[0.7rem] font-mono">
                    last {cell.lastVerdict ? SHORT[cell.lastVerdict] : ""}
                </span>
            </div>
        );
    }
    return <span className="text-ink-faint">·</span>;
}

/**
 * Live progress on the competitive programming set, for putting on a
 * projector during a session. Verdicts are reported by members' browsers;
 * see migration 0020.
 */
export default async function AdminCpPage({
    searchParams,
}: {
    searchParams: Promise<{ window?: string }>;
}) {
    const { supabase } = await requireAdmin();
    const { window: requested } = await searchParams;
    const windowKey: WindowKey = requested && requested in WINDOWS ? (requested as WindowKey) : "3h";
    const since = windowStart(WINDOWS[windowKey].hours);

    const activity = await fetchAllPages<CqgCpActivity>((from, to) => {
        let query = supabase.from("cqg_cp_activity").select("*");
        if (since) query = query.gte("created_at", since);
        return query
            .order("created_at")
            .order("id")
            .range(from, to)
            .overrideTypes<CqgCpActivity[], { merge: false }>();
    });

    const problemIds = CP_PROBLEMS.map((p) => p.id);
    const board = buildBoard(activity, problemIds);

    const ids = board.map((row) => row.profileId);
    const { data: profiles } = ids.length
        ? await supabase.from("cqg_profiles").select("id, name").in("id", ids)
        : { data: [] as { id: string; name: string }[] };
    const names = new Map((profiles ?? []).map((p) => [p.id, p.name]));

    const solvedBy = Object.fromEntries(
        problemIds.map((id) => [id, board.filter((row) => row.cells[id].solvedAfterMin !== null).length]),
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {(Object.keys(WINDOWS) as WindowKey[]).map((key) => (
                        <Link
                            key={key}
                            href={`/portal/admin/cp?window=${key}`}
                            className={`tag ${key === windowKey ? "tag-sky" : "tag-outline"}`}
                        >
                            {WINDOWS[key].label}
                        </Link>
                    ))}
                </div>
                <LiveRefresh seconds={5} />
            </div>

            <p className="text-ink-faint text-sm">
                {board.length} {board.length === 1 ? "member has" : "members have"} opened the problems
                {since ? ` in the ${WINDOWS[windowKey].label.toLowerCase()}` : ""}. Times are minutes from
                each member&apos;s first activity in this window. Verdicts come from members&apos;
                browsers, so treat this as a practice board, not a grade.
            </p>

            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Member</th>
                            <th>Started</th>
                            {CP_PROBLEMS.map((p) => (
                                <th key={p.id} style={{ textAlign: "center" }} title={p.title}>
                                    {p.letter}
                                    <span className="block normal-case tracking-normal font-normal">
                                        {solvedBy[p.id]} solved
                                    </span>
                                </th>
                            ))}
                            <th style={{ textAlign: "center" }}>Solved</th>
                            <th style={{ textAlign: "center" }}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {board.length === 0 && (
                            <tr>
                                <td colSpan={5 + CP_PROBLEMS.length} className="text-ink-faint text-center">
                                    Nobody yet. This fills in as members open /portal/cp.
                                </td>
                            </tr>
                        )}
                        {board.map((row, i) => (
                            <tr key={row.profileId}>
                                <td className="font-mono">{i + 1}</td>
                                <td>{names.get(row.profileId) ?? "Unknown member"}</td>
                                <td className="font-mono text-xs">{time(row.startedAt)}</td>
                                {CP_PROBLEMS.map((p) => (
                                    <td key={p.id} style={{ textAlign: "center" }}>
                                        <Cell cell={row.cells[p.id]} />
                                    </td>
                                ))}
                                <td style={{ textAlign: "center" }} className="font-bold text-navy">
                                    {row.solved}
                                </td>
                                <td style={{ textAlign: "center" }} className="font-mono text-xs">
                                    {row.totalMin}m
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
