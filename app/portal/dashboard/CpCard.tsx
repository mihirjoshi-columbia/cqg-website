import type { CqgProfile } from "@/lib/supabase/types";
import { CP_PROBLEMS } from "@/lib/cp/problems";

/**
 * Competitive programming entry point. Internal Members only, for the same
 * reason GameCard is: a general-body dashboard shows nothing rather than a
 * locked teaser.
 */
export default function CpCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier !== "member" && profile.tier !== "admin") return null;

    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-lime w-fit">Internal practice</span>
                <p className="text-ink-soft text-sm">
                    {CP_PROBLEMS.length} contest problems on DP and expected value, written up
                    with the exec board. Solve them in Python and get a verdict from the judge
                    right in your browser.
                </p>
                <a href="/portal/cp" className="btn-cqg btn-lime btn-sm w-fit">
                    Start solving
                </a>
            </div>
        </div>
    );
}
