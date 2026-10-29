import { createClient } from "@/lib/supabase/server";
import { applyForCttAction, finishCttApplicationAction, updateTravelLodgingAction } from "./actions";
import TravelLodgingUpdateForm from "./TravelLodgingUpdateForm";
import { needsTravelLodgingAnswers } from "@/lib/ctt-application";
import CttApplicationForm from "@/components/ctt/CttApplicationForm";
import CttStatusCard from "@/components/ctt/CttStatusCard";
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

    // The latest application, whichever cycle: once applications close, the dashboard still has to
    // show the applicant where they stand (including an offer they need to answer).
    const { data: latest } = await supabase
        .from("ctt_applications")
        .select("*, cycle:ctt_cycles(label)")
        .eq("ctt_profile_id", profile.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CttApplication & { cycle: { label: string } | null }, { merge: false }>();

    const application = latest && (!cycle || latest.cycle_id === cycle.id) ? latest : null;

    if (application) {
        const cycleLabel = application.cycle?.label ?? cycle?.label ?? "CTT";
        const statusCard = (
            <CttStatusCard
                applicationId={application.id}
                status={application.status}
                offerExpiresAt={application.offer_expires_at}
                cycleLabel={cycleLabel}
            >
                {application.details_complete && needsTravelLodgingAnswers(application) && (
                    <TravelLodgingUpdateForm action={updateTravelLodgingAction} />
                )}
            </CttStatusCard>
        );
        // An application made on their behalf still needs the rest of its answers.
        if (!application.details_complete) {
            return (
                <div className="flex flex-col gap-4">
                    {statusCard}
                    <CttApplicationForm
                        action={finishCttApplicationAction}
                        cycleLabel={cycleLabel}
                        finish={{
                            applicationId: application.id,
                            college: application.college,
                            major: application.major,
                            gradYear: application.grad_year,
                        }}
                    />
                </div>
            );
        }
        return statusCard;
    }

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

    return <CttApplicationForm action={applyForCttAction} cycleLabel={cycle.label} />;
}
