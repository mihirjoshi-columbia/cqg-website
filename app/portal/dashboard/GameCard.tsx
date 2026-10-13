import type { CqgProfile } from "@/lib/supabase/types";

/**
 * Make the Market entry point. Internal Members only -- the game is a
 * training exercise for the selective cohort, so a general-body dashboard
 * shows nothing at all rather than a locked teaser.
 */
export default function GameCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier !== "member" && profile.tier !== "admin") return null;

    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-lime w-fit">Internal homework</span>
                <p className="text-ink-soft text-sm">
                    Quote two-sided markets on a nine-card total against four very different market
                    makers. Five rounds a hand, across four difficulties.
                </p>
                <a href="/portal/game" className="btn-cqg btn-lime btn-sm w-fit">
                    Play a hand
                </a>
            </div>
        </div>
    );
}
