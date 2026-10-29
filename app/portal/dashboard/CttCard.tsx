import { createClient } from "@/lib/supabase/server";
import { applyForCttAction } from "./actions";
import CttApplicationForm from "@/components/ctt/CttApplicationForm";
import CttStatusCard from "@/components/ctt/CttStatusCard";
import { cqgSchoolToCollegeName } from "@/lib/domains";
import type { CqgProfile, CttCycle, CttApplication } from "@/lib/supabase/types";

export default async function CttCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier === "member" || profile.tier === "senior_advisor") {
        const role = profile.tier === "member" ? "Internal Members" : "Senior Advisors";
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CTT</span>
                    <p className="text-ink-soft text-sm">
                        {role} aren&apos;t eligible to compete in CTT while holding that role.
                    </p>
                </div>
            </div>
        );
    }

    if (profile.school === "GRAD") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">CTT</span>
                    <p className="text-ink-soft text-sm">
                        CTT is limited to undergraduates. You&apos;re welcome to stay active as a General Body
                        member — firm events and Q&amp;As are open to grad students too.
                    </p>
                </div>
            </div>
        );
    }

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
        .eq("cqg_profile_id", profile.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CttApplication & { cycle: { label: string } | null }, { merge: false }>();

    if (!cycle && !latest) {
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

    const application = latest && (!cycle || latest.cycle_id === cycle.id) ? latest : null;

    if (application) {
        return (
            <CttStatusCard
                applicationId={application.id}
                status={application.status}
                offerExpiresAt={application.offer_expires_at}
                cycleLabel={application.cycle?.label ?? cycle?.label ?? "CTT"}
            />
        );
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

    return (
        <CttApplicationForm
            action={applyForCttAction}
            cycleLabel={cycle.label}
            lockedCollege={cqgSchoolToCollegeName(profile.school)}
            lockedGender={profile.gender ?? undefined}
            askTravelLodging={false}
        />
    );
}
