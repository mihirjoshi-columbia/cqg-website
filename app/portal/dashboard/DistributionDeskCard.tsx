import { createServiceRoleClient } from "@/lib/supabase/server";
import { listAttempts, summarise, type AttemptSummary } from "@/lib/game/dd/contests";
import type { CqgGameContest, CqgProfile } from "@/lib/supabase/types";

/**
 * Distribution Desk entry point. Internal Members only, for the same reason
 * GameCard is: the coursework belongs to the selective cohort, so a
 * general-body dashboard shows nothing rather than a locked teaser.
 *
 * Surfaces the live contest when there is one, because that is the thing with
 * a deadline; practice is always available underneath it.
 */
export default async function DistributionDeskCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier !== "member" && profile.tier !== "admin") return null;

    const admin = createServiceRoleClient();
    const nowIso = new Date().toISOString();
    const { data: contests } = await admin
        .from("cqg_game_contests")
        .select("*")
        .lte("opens_at", nowIso)
        .gte("closes_at", nowIso)
        .order("closes_at", { ascending: true })
        .limit(1)
        .overrideTypes<CqgGameContest[], { merge: false }>();

    const contest = contests?.[0] ?? null;

    let attempts: AttemptSummary | null = null;
    if (contest) {
        attempts = summarise(contest, await listAttempts(contest.id, profile.id));
    }

    // Started counts as used. Runs are stateless by design -- nothing stores
    // an in-flight run -- so there is no resume, and offering one would be a
    // lie. The warning before starting says so.
    const exhausted = attempts ? attempts.remaining === 0 : false;

    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-lime w-fit">Internal homework</span>
                <p className="text-ink-soft text-sm">
                    Price contracts that settle on a binomial, geometric or normal process, then
                    quote a market wide enough for the risk and no wider. Information arrives
                    halfway through each contract. Graded, best of three attempts.
                </p>

                {contest ? (
                    <>
                        <p className="text-ink-faint text-xs">
                            {contest.label} &middot; closes{" "}
                            {new Date(contest.closes_at).toLocaleString()}
                            {attempts && (
                                <>
                                    {" "}
                                    &middot; {attempts.remaining} of {attempts.allowed} attempts
                                    left
                                    {attempts.bestScore !== null && (
                                        <> &middot; best {attempts.bestScore.toFixed(2)}</>
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
                                        ? "Use another attempt"
                                        : "Start the homework"}
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
