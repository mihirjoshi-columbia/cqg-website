import { createClient } from "@/lib/supabase/server";
import { applyForMembershipAction } from "./actions";
import ApplyButton from "./ApplyButton";
import type { CqgProfile, CqgMembershipCycle, CqgMembershipApplication } from "@/lib/supabase/types";

export default async function MembershipCard({ profile }: { profile: CqgProfile }) {
    if (profile.tier === "member" || profile.tier === "admin") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-lime w-fit">Internal Member</span>
                    <p className="text-ink-soft text-sm">
                        You&apos;re a current Internal Member — thanks for being part of the selective cohort.
                    </p>
                </div>
            </div>
        );
    }

    if (profile.school === "GRAD") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">Internal Membership</span>
                    <p className="text-ink-soft text-sm">
                        Internal Membership is limited to undergraduates (CC/SEAS/Barnard/GS). You&apos;re welcome
                        to stay active as a General Body member — firm events and Q&amp;As are open to grad
                        students too.
                    </p>
                </div>
            </div>
        );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: cycle } = await supabase
        .from("cqg_membership_cycles")
        .select("*")
        .lte("opens_at", now)
        .gte("closes_at", now)
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CqgMembershipCycle, { merge: false }>();

    if (!cycle) {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-outline w-fit">Internal Membership</span>
                    <p className="text-ink-soft text-sm">
                        Applications aren&apos;t open right now — Internal Membership recruitment runs once a
                        year, every fall.
                    </p>
                </div>
            </div>
        );
    }

    const { data: application } = await supabase
        .from("cqg_membership_applications")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle()
        .overrideTypes<CqgMembershipApplication, { merge: false }>();

    if (application) {
        const statusCopy: Record<string, { tag: string; label: string; body: string }> = {
            pending: {
                tag: "tag-sky",
                label: "Application pending",
                body: `Your application to ${cycle.label} is in — we'll email you once it's been reviewed.`,
            },
            approved: {
                tag: "tag-lime",
                label: "Accepted",
                body: "Congrats — your Internal Membership application was accepted.",
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
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-lime w-fit">Applications open</span>
                <p className="text-ink-soft text-sm">
                    {cycle.label} is open now. Applying uses the profile and resume you already have on file.
                </p>
                <form action={applyForMembershipAction}>
                    <ApplyButton />
                </form>
            </div>
        </div>
    );
}
