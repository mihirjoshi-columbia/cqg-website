import { createClient } from "@/lib/supabase/server";
import { applyForCttAction, updateTravelLodgingAction } from "./actions";
import TravelLodgingUpdateForm from "./TravelLodgingUpdateForm";
import { needsTravelLodgingAnswers } from "@/lib/ctt-application";
import CttApplicationForm from "@/components/ctt/CttApplicationForm";
import type { CttProfile, CttCycle, CttApplication } from "@/lib/supabase/types";

export default async function ApplicationCard({ profile }: { profile: CttProfile }) {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: cycle } = await supabase
        .from("ctt_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CttCycle, { merge: false }>();

    if (!cycle) {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CTT</span>
                    <p className="text-ink-soft text-sm">
                        Applications aren&apos;t open right now — check back when the next CTT cycle opens.
                    </p>
                </div>
            </div>
        );
    }

    const { data: application } = await supabase
        .from("ctt_applications")
        .select("*")
        .eq("ctt_profile_id", profile.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle()
        .overrideTypes<CttApplication, { merge: false }>();

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
                    {needsTravelLodgingAnswers(application) && <TravelLodgingUpdateForm action={updateTravelLodgingAction} />}
                </div>
            </div>
        );
    }

    return <CttApplicationForm action={applyForCttAction} cycleLabel={cycle.label} />;
}
