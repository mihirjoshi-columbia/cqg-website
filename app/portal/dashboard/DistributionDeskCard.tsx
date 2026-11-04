import { createServiceRoleClient } from "@/lib/supabase/server";
import { listAttempts, summarise, type AttemptSummary } from "@/lib/game/dd/contests";
import { RANKED_RUNS } from "@/lib/game/dd/types";
import type { CqgGameContest, CqgProfile } from "@/lib/supabase/types";

/**
 * Distribution Desk entry point. Internal Members only, for the same reason
 * GameCard is: the coursework belongs to the selective cohort, so a
 * general-body dashboard shows nothing rather than a locked teaser.
 *
 * Surfaces the open practice set when there is one. Attempts are unlimited,
 * so what the card reports is how many runs someone has finished and the
 * average that ranks them, not a quota.
 */
export default async function DistributionDeskCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier !== "member" && profile.tier !== "admin") return null;

    const admin = createServiceRoleClient();
    const nowIso = new Date().toISOString();
    const { data: contests } = await admin
        .from("cqg_game_contests")
        .select("*")
        .lte("opens_at", nowIso)
        // A null closes_at never closes.
        .or(`closes_at.is.null,closes_at.gte.${nowIso}`)
        .order("closes_at", { ascending: true, nullsFirst: false })
        .limit(1)
        .overrideTypes<CqgGameContest[], { merge: false }>();

    const contest = contests?.[0] ?? null;

    let attempts: AttemptSummary | null = null;
    if (contest) {
        attempts = summarise(contest, await listAttempts(contest.id, profile.id));
    }

    // Only a contest with an explicit attempt cap can run out; the practice
    // set has none. Runs are stateless by design -- nothing stores an
    // in-flight run -- so there is still no resume.
    const exhausted = attempts?.remaining === 0;

    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-lime w-fit">Internal practice</span>
                <p className="text-ink-soft text-sm">
                    Price contracts that settle on a binomial, a geometric or a sum of many
                    independent draws, then
                    quote a market wide enough for the risk and no wider. Information arrives
                    halfway through each contract. A different set of contracts every run, as
                    many runs as you like.
                </p>

                {contest ? (
                    <>
                        <p className="text-ink-faint text-xs">
                            {contest.label}
                            {attempts && (
                                <>
                                    {" "}
                                    &middot; {attempts.completed} run
                                    {attempts.completed === 1 ? "" : "s"} finished
                                    {!attempts.unlimited && (
                                        <> &middot; {attempts.remaining} attempts left</>
                                    )}
                                    {attempts.recentAverage !== null && (
                                        <>
                                            {" "}
                                            &middot; last {RANKED_RUNS} average score{" "}
                                            {attempts.recentAverage.toFixed(2)}
                                        </>
                                    )}
                                </>
                            )}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {!exhausted && (
                                <a
                                    href={`/portal/game/dd?contest=${contest.slug}`}
                                    className="btn-cqg btn-lime btn-sm w-fit"
                                >
                                    {attempts && attempts.used > 0
                                        ? "Play another run"
                                        : "Start practising"}
                                </a>
                            )}
                            <a
                                href={`/portal/leaderboard?contest=${contest.slug}`}
                                className="btn-cqg btn-outline-navy btn-sm w-fit"
                            >
                                Leaderboard
                            </a>
                        </div>
                    </>
                ) : (
                    <p className="text-ink-faint text-xs">
                        Nothing is open right now.
                    </p>
                )}
            </div>
        </div>
    );
}
