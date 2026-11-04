import Link from "next/link";
import { requireSignedInMember } from "@/lib/game/require-internal-member";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listAttempts, summarise, type AttemptSummary } from "@/lib/game/dd/contests";
import type { CqgGameContest } from "@/lib/supabase/types";
import DdGame from "@/components/game/dd/DdGame";

export const metadata = { title: "Distribution Desk — CQG Portal" };

// Clock reads live in helpers rather than the component body, matching
// app/portal/admin/cycles/page.tsx.
function hasClosed(contest: CqgGameContest): boolean {
    if (contest.closes_at === null) return false;
    return Date.now() > new Date(contest.closes_at).getTime();
}

function hasNotOpened(contest: CqgGameContest): boolean {
    return Date.now() < new Date(contest.opens_at).getTime();
}

/**
 * Distribution Desk practice. Unlimited runs, each dealt its own contracts.
 *
 * With no ?contest= the page finds the open one itself, so the link students
 * are given is just /portal/game/dd.
 *
 * The checks here only decide what to RENDER. The real gate is in the start
 * route, which re-checks the window and inserts the attempt row -- a page
 * cannot be trusted to have hidden a button, the same reasoning
 * lib/game/require-internal-member.ts gives for route handlers.
 */
export default async function DistributionDeskPage({
    searchParams,
}: {
    searchParams: Promise<{ contest?: string }>;
}) {
    const { profile, isInternal } = await requireSignedInMember();
    const { contest: slug } = await searchParams;

    let contest: CqgGameContest | null = null;
    let attempts: AttemptSummary | null = null;

    if (isInternal) {
        const admin = createServiceRoleClient();
        const { data: all } = await admin
            .from("cqg_game_contests")
            .select("*")
            .order("opens_at", { ascending: false })
            .overrideTypes<CqgGameContest[], { merge: false }>();

        const contests = all ?? [];
        contest = slug
            ? (contests.find((c) => c.slug === slug) ?? null)
            : // Default to whichever one is live, falling back to the newest
              // so a closed contest still shows its result rather than 404.
              (contests.find((c) => !hasClosed(c) && !hasNotOpened(c)) ?? contests[0] ?? null);

        if (contest) {
            attempts = summarise(contest, await listAttempts(contest.id, profile.id));
        }
    }

    const best =
        attempts?.bestScore !== null && attempts?.bestScore !== undefined
            ? ` Your best score was ${attempts.bestScore.toFixed(2)}.`
            : "";

    const lockedReason = !contest || !attempts
        ? undefined
        : hasClosed(contest)
          ? `This has closed.${best}`
          : hasNotOpened(contest)
            ? `This opens ${new Date(contest.opens_at).toLocaleString()}.`
            : attempts.remaining === 0
              ? `You have used all ${attempts.allowed} of your attempts.${best}`
              : undefined;

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">
                        Distribution Desk
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {contest && (
                        <Link
                            href={`/portal/leaderboard?contest=${contest.slug}`}
                            className="btn-cqg btn-outline-navy btn-sm"
                        >
                            Leaderboard
                        </Link>
                    )}
                    <Link href="/portal/dashboard" className="btn-cqg btn-outline-navy btn-sm">
                        Back to my dashboard
                    </Link>
                </div>
            </div>

            {!isInternal ? (
                // Explained rather than redirected: bouncing a general-body
                // member to the dashboard with no reason reads as a bug.
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <span className="tag tag-outline w-fit">Internal Members only</span>
                        <p className="text-ink-soft text-sm">
                            Distribution Desk is coursework for CQG&apos;s Internal Members, so it
                            is not open to General Body accounts. The Internal Membership
                            application opens each recruitment cycle — you can apply from your
                            dashboard when a cycle is live.
                        </p>
                        <p className="text-ink-faint text-xs">Signed in as {profile.email}.</p>
                    </div>
                </div>
            ) : !contest ? (
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <p className="text-ink-soft text-sm">
                            Nothing has been set up yet.
                        </p>
                    </div>
                </div>
            ) : (
                <DdGame
                    contestSlug={contest.slug}
                    contestLabel={contest.label}
                    attemptsUsed={attempts?.used ?? 0}
                    attemptsAllowed={attempts?.allowed ?? contest.attempts_allowed}
                    completed={attempts?.completed ?? 0}
                    recentAverage={attempts?.recentAverage ?? null}
                    bestScore={attempts?.bestScore ?? null}
                    locked={Boolean(lockedReason)}
                    lockedReason={lockedReason}
                />
            )}
        </div>
    );
}
