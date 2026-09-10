import { createClient } from "@/lib/supabase/server";
import { applyForCutcAction } from "./actions";
import CutcApplicationForm from "@/components/cutc/CutcApplicationForm";
import { cqgSchoolToCollegeName } from "@/lib/domains";
import type { CqgProfile, CutcCycle, CutcApplication } from "@/lib/supabase/types";

export default async function CutcCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier === "member") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CUTC</span>
                    <p className="text-ink-soft text-sm">
                        Internal Members aren&apos;t eligible to compete in CUTC while holding that role.
                    </p>
                </div>
            </div>
        );
    }

    if (profile.school === "GRAD") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CUTC</span>
                    <p className="text-ink-soft text-sm">
                        CUTC is limited to undergraduates. You&apos;re welcome to stay active as a General Body
                        member — firm events and Q&amp;As are open to grad students too.
                    </p>
                </div>
            </div>
        );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: cycle } = await supabase
        .from("cutc_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CutcCycle, { merge: false }>();

    if (!cycle) {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CUTC</span>
                    <p className="text-ink-soft text-sm">
                        Applications aren&apos;t open right now — check back when the next CUTC cycle opens.
                    </p>
                </div>
            </div>
        );
    }

    const { data: application } = await supabase
        .from("cutc_applications")
        .select("*")
        .eq("cqg_profile_id", profile.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle()
        .overrideTypes<CutcApplication, { merge: false }>();

    if (application) {
        const statusCopy: Record<string, { tag: string; label: string; body: string }> = {
            pending: {
                tag: "tag-sky",
                label: "Application pending",
                body: `Your application to ${cycle.label} is in — we'll email you once it's been reviewed.`,
            },
            approved: {
                tag: "tag-pink",
                label: "Accepted",
                body: "Congrats — you're in. We'll follow up with logistics closer to the event.",
            },
            rejected: {
                tag: "tag-outline",
                label: "Not selected this cycle",
                body: "You weren't selected this cycle. You're welcome to apply again next time applications open.",
            },
        };
        const copy = statusCopy[application.status];
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className={`tag ${copy.tag} w-fit`}>{copy.label}</span>
                    <p className="text-ink-soft text-sm">{copy.body}</p>
                </div>
            </div>
        );
    }

    return (
        <CutcApplicationForm
            action={applyForCutcAction}
            cycleLabel={cycle.label}
            lockedCollege={cqgSchoolToCollegeName(profile.school)}
            lockedGender={profile.gender ?? undefined}
        />
    );
}
