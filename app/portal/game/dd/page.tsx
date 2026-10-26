import Link from "next/link";
import { requireSignedInMember } from "@/lib/game/require-internal-member";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CqgGameAttempt, CqgGameContest } from "@/lib/supabase/types";
import DdGame from "@/components/game/dd/DdGame";

export const metadata = { title: "Distribution Desk — CQG Portal" };

// Clock reads live in helpers rather than the component body, matching
// app/portal/admin/cycles/page.tsx.
function hasClosed(contest: CqgGameContest): boolean {
    return Date.now() > new Date(contest.closes_at).getTime();
}

function hasNotOpened(contest: CqgGameContest): boolean {
    return Date.now() < new Date(contest.opens_at).getTime();
}

/**
 * ?contest=<slug> plays a ranked run; with no slug it is unlimited practice.
 *
 * The attempt check here only decides what to RENDER. The real gate is in
 * the start route, which re-checks and inserts the attempt row -- a page
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
    let attempt: CqgGameAttempt | null = null;

    if (isInternal && slug) {
        const admin = createServiceRoleClient();
        const { data } = await admin
            .from("cqg_game_contests")
            .select("*")
            .eq("slug", slug)
            .maybeSingle<CqgGameContest>();
        contest = data;

        if (contest) {
            const { data: row } = await admin
                .from("cqg_game_attempts")
                .select("*")
                .eq("contest_id", contest.id)
                .eq("profile_id", profile.id)
                .maybeSingle<CqgGameAttempt>();
            attempt = row;
        }
    }

    const closed = contest ? hasClosed(contest) : false;
    const notYetOpen = contest ? hasNotOpened(contest) : false;

    const lockedReason = attempt?.completed_at
        ? `You finished this contest on ${new Date(attempt.completed_at).toLocaleString()} with a P&L of ${Number(attempt.score).toFixed(2)}. One attempt only, so that result stands.`
        : attempt
          ? "You already started this contest. It allows one attempt, and the attempt is recorded when the run is dealt rather than when it is submitted, so starting again is not possible."
          : closed
            ? "This contest has closed."
            : notYetOpen
              ? `This contest opens ${new Date(contest!.opens_at).toLocaleString()}.`
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
            ) : slug && !contest ? (
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <p className="text-ink-soft text-sm">That contest does not exist.</p>
                    </div>
                </div>
            ) : (
                <DdGame
                    contestSlug={contest?.slug}
                    contestLabel={contest?.label}
                    locked={Boolean(lockedReason)}
                    lockedReason={lockedReason}
                />
            )}
        </div>
    );
}
