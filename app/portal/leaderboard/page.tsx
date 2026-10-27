import Link from "next/link";
import { requireSignedInMember } from "@/lib/game/require-internal-member";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/helpers";
import type { CqgGameContest, DdLeaderboardRow } from "@/lib/supabase/types";
import { RANKED_RUNS } from "@/lib/game/dd/types";

export const metadata = { title: "Leaderboard — CQG Portal" };

// Clock reads live in a helper rather than the component body, matching
// app/portal/admin/cycles/page.tsx.
function isPublished(contest: CqgGameContest): boolean {
    return Date.now() >= new Date(contest.leaderboard_visible_at).getTime();
}

export default async function LeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<{ contest?: string }>;
}) {
    const { profile, isInternal } = await requireSignedInMember();
    const { contest: slug } = await searchParams;

    const admin = createServiceRoleClient();
    const { data: contests } = await admin
        .from("cqg_game_contests")
        .select("*")
        .order("opens_at", { ascending: false })
        .overrideTypes<CqgGameContest[], { merge: false }>();

    const list = contests ?? [];
    const contest = slug ? list.find((c) => c.slug === slug) : list[0];

    let rows: DdLeaderboardRow[] = [];
    let unavailable: string | null = null;

    if (isInternal && contest) {
        // Called as the SIGNED-IN user, not the service role: dd_leaderboard
        // is SECURITY DEFINER and does its own membership and publication
        // checks against auth.uid(), so calling it with the service role
        // would skip exactly the checks that make it safe to expose.
        const supabase = await createClient();
        const { data, error } = await callRpc(supabase, "dd_leaderboard", {
            p_slug: contest.slug,
        });
        if (error) {
            unavailable = !isPublished(contest)
                    ? `Standings are published ${new Date(contest.leaderboard_visible_at).toLocaleString()}.`
                    : "The leaderboard could not be loaded.";
        } else {
            rows = data ?? [];
        }
    }

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">
                        {contest ? contest.label : "Leaderboard"}
                    </h1>
                </div>
                <Link href="/portal/dashboard" className="btn-cqg btn-outline-navy btn-sm">
                    Back to my dashboard
                </Link>
            </div>

            {!isInternal ? (
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <span className="tag tag-outline w-fit">Internal Members only</span>
                        <p className="text-ink-soft text-sm">
                            Contest standings are open to CQG&apos;s Internal Members.
                        </p>
                        <p className="text-ink-faint text-xs">Signed in as {profile.email}.</p>
                    </div>
                </div>
            ) : !contest ? (
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <p className="text-ink-soft text-sm">No contests have been set up yet.</p>
                    </div>
                </div>
            ) : (
                <>
                    {list.length > 1 && (
                        <div className="flex gap-2 flex-wrap mb-6">
                            {list.map((c) => (
                                <Link
                                    key={c.slug}
                                    href={`/portal/leaderboard?contest=${c.slug}`}
                                    className={`tag ${c.slug === contest.slug ? "tag-lime" : "tag-outline"}`}
                                >
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {unavailable ? (
                        <div className="event-card" style={{ maxWidth: 640 }}>
                            <div className="event-card-body">
                                <p className="text-ink-soft text-sm">{unavailable}</p>
                            </div>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="event-card" style={{ maxWidth: 560 }}>
                            <div className="event-card-body">
                                <p className="text-ink-soft text-sm">
                                    Nobody has finished a run yet.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="event-card">
                            <div className="event-card-body">
                                {/* Each run is dealt its own contracts, so a single
                                    total would rank the luckiest deal. The ranked
                                    number is the mean of someone's last few finished
                                    runs -- see migration 0016. */}
                                <p className="text-ink-faint text-xs mb-4">
                                    Ranked on the average score of each member&apos;s last{" "}
                                    {RANKED_RUNS} finished runs. A score is P&amp;L measured
                                    against the risk the deal carried, so runs dealt different
                                    contracts stay comparable.
                                </p>
                                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr className="text-ink-faint text-xs uppercase tracking-wider">
                                            <th className="text-left pb-2 pr-4">#</th>
                                            <th className="text-left pb-2 pr-4">Member</th>
                                            <th className="text-right pb-2 pr-4">Runs</th>
                                            <th className="text-right pb-2">Average score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => {
                                            const you = row.profile_id === profile.id;
                                            return (
                                                <tr
                                                    key={row.profile_id}
                                                    className={you ? "font-semibold text-navy" : "text-ink-soft"}
                                                    style={{ borderTop: "1px solid var(--navy-line, #e5e7eb)" }}
                                                >
                                                    <td className="py-2 pr-4 tabular-nums">{row.rank}</td>
                                                    <td className="py-2 pr-4">
                                                        {row.name}
                                                        {you && " (you)"}
                                                    </td>
                                                    <td className="py-2 pr-4 text-right tabular-nums">
                                                        {row.runs}
                                                    </td>
                                                    <td className="py-2 text-right tabular-nums">
                                                        {Number(row.score).toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
