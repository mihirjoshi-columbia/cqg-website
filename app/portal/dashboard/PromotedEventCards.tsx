import { createClient } from "@/lib/supabase/server";
import { ApplyButton } from "@/app/portal/events/EventActions";
import { getPromotedEvents } from "@/lib/promo-events";
import { COLOR_STYLES, eligibilityProblem } from "@/lib/events";
import type { CqgEventApplication, CqgSchool, CqgTier } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending review",
    accepted: "You're in",
    waitlisted: "Waitlisted",
    rejected: "Not selected",
};

/**
 * RSVP cards on the portal dashboard for every event promoted on the homepage. They show until
 * the event is over or RSVPs are locked; with none promoted, nothing is rendered.
 */
export default async function PromotedEventCards({ userId }: { userId: string }) {
    const events = await getPromotedEvents();
    if (events.length === 0) return null;

    const supabase = await createClient();
    const [{ data: applications }, { data: profile }] = await Promise.all([
        supabase
            .from("cqg_event_applications")
            .select("*")
            .eq("profile_id", userId)
            .in("event_id", events.map((e) => e.id))
            .overrideTypes<CqgEventApplication[], { merge: false }>(),
        supabase
            .from("cqg_profiles")
            .select("school,tier")
            .eq("id", userId)
            .maybeSingle()
            .overrideTypes<{ school: CqgSchool | null; tier: CqgTier }, { merge: false }>(),
    ]);
    const byEvent = new Map((applications ?? []).filter((a) => a.status !== "withdrawn").map((a) => [a.event_id, a]));

    return (
        <section>
            <h2 className="eyebrow mb-3 block">{events.length > 1 ? "Upcoming events" : "Upcoming event"}</h2>
            <div className="flex flex-col gap-4">
                {events.map((event) => {
                    const color = COLOR_STYLES[event.color];
                    const active = byEvent.get(event.id);
                    const blocked = eligibilityProblem(event.eligibility, profile?.school ?? null, profile?.tier === "admin");
                    return (
                        <div key={event.id} className="event-card">
                            <div className="event-card-body">
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div>
                                        <h3 className="font-display font-bold text-navy">{event.title}</h3>
                                        <p className="text-ink-faint text-xs mt-1">
                                            {event.when}
                                            {event.location ? ` · ${event.location}` : ""}
                                            {event.audience ? ` · ${event.audience}` : ""}
                                        </p>
                                    </div>
                                    {active ? (
                                        <span className={`tag ${active.status === "accepted" ? color.tag : "tag-outline"}`}>{STATUS_LABEL[active.status] ?? active.status}</span>
                                    ) : blocked ? null : (
                                        <ApplyButton eventId={event.id} label={event.instantRsvp ? "RSVP" : "Apply"} tone={event.color} />
                                    )}
                                </div>
                                {event.description && <p className="text-ink-soft text-sm">{event.description}</p>}
                                {!active && blocked && <p className="text-ink-faint text-xs">{blocked}</p>}
                                {active?.status === "accepted" && (
                                    <p className="text-ink-faint text-xs">Your RSVP is confirmed. You can manage it under Events.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
