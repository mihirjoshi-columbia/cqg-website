import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplyButton, WithdrawButton } from "./EventActions";
import type { CqgEvent, CqgEventApplication } from "@/lib/supabase/types";

export const metadata = { title: "Events — CQG Portal" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    accepted: "tag-lime",
    waitlisted: "tag-outline",
    rejected: "tag-outline",
    withdrawn: "tag-outline",
};

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending review",
    accepted: "You're in",
    waitlisted: "Waitlisted",
    rejected: "Not selected",
    withdrawn: "Withdrawn",
};

export default async function PortalEventsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("resume_path")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<{ resume_path: string | null }, { merge: false }>();
    if (!profile?.resume_path) redirect("/portal/complete-profile");

    const { data: events } = await supabase
        .from("cqg_events")
        .select("*")
        .order("starts_at", { ascending: true })
        .overrideTypes<CqgEvent[], { merge: false }>();

    const { data: myApplications } = await supabase
        .from("cqg_event_applications")
        .select("*")
        .eq("profile_id", user.id)
        .overrideTypes<CqgEventApplication[], { merge: false }>();

    const appMap = new Map((myApplications ?? []).map((a) => [a.event_id, a]));
    const attended = (myApplications ?? []).filter((a) => a.attended);
    const eventById = new Map((events ?? []).map((e) => [e.id, e]));

    return (
        <div className="portal-shell">
            <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
            <h1 className="font-display font-extrabold text-2xl text-navy mb-8">Events</h1>

            <div className="flex flex-col gap-10" style={{ maxWidth: 640 }}>
                <section>
                    <h2 className="eyebrow mb-3 block">Upcoming &amp; open events</h2>
                    <div className="flex flex-col gap-4">
                        {(events ?? []).map((event) => {
                            const app = appMap.get(event.id);
                            const canWithdraw =
                                app &&
                                !event.applications_locked &&
                                (app.status === "pending" || app.status === "accepted" || app.status === "waitlisted");
                            return (
                                <div key={event.id} className="event-card">
                                    <div className="event-card-body">
                                        <div className="flex items-start justify-between flex-wrap gap-3">
                                            <div>
                                                <h3 className="font-display font-bold text-navy">{event.title}</h3>
                                                <p className="text-ink-faint text-xs mt-1">
                                                    {new Date(event.starts_at).toLocaleString()}
                                                    {event.location ? ` — ${event.location}` : ""}
                                                </p>
                                            </div>
                                            {app ? (
                                                <span className={`tag ${STATUS_TAG[app.status]}`}>{STATUS_LABEL[app.status]}</span>
                                            ) : (
                                                <ApplyButton eventId={event.id} />
                                            )}
                                        </div>
                                        {event.description && <p className="text-ink-soft text-sm">{event.description}</p>}
                                        {canWithdraw && <WithdrawButton applicationId={app!.id} />}
                                    </div>
                                </div>
                            );
                        })}
                        {!events?.length && <p className="text-ink-faint text-sm">No events posted yet.</p>}
                    </div>
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">My attendance history</h2>
                    <div className="flex flex-col gap-2">
                        {attended.map((a) => {
                            const event = eventById.get(a.event_id);
                            return (
                                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-line">
                                    <span className="tag tag-lime" style={{ fontSize: "0.68rem" }}>Attended</span>
                                    <span className="text-navy text-sm font-semibold">{event?.title ?? a.event_id}</span>
                                    {event && <span className="text-ink-faint text-xs">{new Date(event.starts_at).toLocaleDateString()}</span>}
                                </div>
                            );
                        })}
                        {!attended.length && <p className="text-ink-faint text-sm">No events attended yet.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
