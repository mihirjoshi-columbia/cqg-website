import { createClient } from "@/lib/supabase/server";
import { ApplyButton } from "@/app/portal/events/EventActions";
import { QUANT_FAIR_BLURB, QUANT_FAIR_LOCATION, QUANT_FAIR_TITLE, QUANT_FAIR_WHEN, quantFairOver } from "@/lib/quant-fair";
import type { CqgEvent, CqgEventApplication } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending review",
    accepted: "You're in",
    waitlisted: "Waitlisted",
    rejected: "Not selected",
};

/**
 * RSVP card for the Columbia Quant Fair on the portal dashboard. It shows until the fair is
 * over, and nothing at all if the event hasn't been created yet.
 */
export default async function QuantFairCard({ userId }: { userId: string }) {
    if (quantFairOver()) return null;

    const supabase = await createClient();
    const { data: event } = await supabase
        .from("cqg_events")
        .select("*")
        .ilike("title", QUANT_FAIR_TITLE)
        .limit(1)
        .maybeSingle()
        .overrideTypes<CqgEvent, { merge: false }>();
    if (!event) return null;

    const { data: application } = await supabase
        .from("cqg_event_applications")
        .select("*")
        .eq("event_id", event.id)
        .eq("profile_id", userId)
        .maybeSingle()
        .overrideTypes<CqgEventApplication, { merge: false }>();
    const active = application && application.status !== "withdrawn" ? application : null;

    return (
        <section>
            <h2 className="eyebrow mb-3 block">Columbia Quant Fair</h2>
            <div className="event-card">
                <div className="event-card-body">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h3 className="font-display font-bold text-navy">{QUANT_FAIR_WHEN} &middot; {QUANT_FAIR_LOCATION}</h3>
                            <p className="text-ink-soft text-sm mt-1">{QUANT_FAIR_BLURB}</p>
                        </div>
                        {active ? (
                            <span className={`tag ${active.status === "accepted" ? "tag-pink" : "tag-outline"}`}>{STATUS_LABEL[active.status] ?? active.status}</span>
                        ) : (
                            <ApplyButton eventId={event.id} label="RSVP" tone="pink" />
                        )}
                    </div>
                    {active?.status === "accepted" && (
                        <p className="text-ink-faint text-xs">Your RSVP is confirmed. You can manage it under Events.</p>
                    )}
                </div>
            </div>
        </section>
    );
}
