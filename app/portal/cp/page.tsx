import Link from "next/link";
import { requireSignedInMember } from "@/lib/game/require-internal-member";
import CpJudge from "@/components/cp/CpJudge";

export const metadata = { title: "Competitive Programming — CQG Portal" };

export default async function CpPage() {
    const { profile, isInternal } = await requireSignedInMember();

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">
                        Competitive Programming
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/portal/dashboard" className="btn-cqg btn-outline-navy btn-sm">
                        Back to my dashboard
                    </Link>
                </div>
            </div>

            {isInternal ? (
                <CpJudge />
            ) : (
                // Explained rather than redirected: bouncing a general-body
                // member to the dashboard with no reason reads as a bug.
                <div className="event-card" style={{ maxWidth: 560 }}>
                    <div className="event-card-body">
                        <span className="tag tag-outline w-fit">Internal Members only</span>
                        <p className="text-ink-soft text-sm">
                            The competitive programming set is practice for CQG&apos;s Internal
                            Members, so it is not open to General Body accounts. The Internal
                            Membership application opens each recruitment cycle — you can apply
                            from your dashboard when a cycle is live.
                        </p>
                        <p className="text-ink-faint text-xs">Signed in as {profile.email}.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
