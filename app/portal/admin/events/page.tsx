import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import EventForm from "./EventForm";
import LockToggle from "./LockToggle";
import DeleteEventButton from "./DeleteEventButton";
import { formatEventTime } from "@/lib/events";
import type { CqgEvent } from "@/lib/supabase/types";

export const metadata = { title: "Events — CQG Admin" };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
    const { edit } = await searchParams;
    const { supabase } = await requireAdmin();

    const { data: events } = await supabase
        .from("cqg_events")
        .select("*")
        .order("starts_at", { ascending: false })
        .overrideTypes<CqgEvent[], { merge: false }>();

    // RSVP/application count per event, shown in the delete confirmation.
    const counts = new Map<string, number>();
    await Promise.all(
        (events ?? []).map(async (e) => {
            const { count } = await supabase
                .from("cqg_event_applications")
                .select("id", { count: "exact", head: true })
                .eq("event_id", e.id);
            counts.set(e.id, count ?? 0);
        })
    );
    const editing = edit ? (events ?? []).find((e) => e.id === edit) : undefined;

    return (
        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(280px, 380px)" }}>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Starts</th>
                            <th>Capacity</th>
                            <th>Applications</th>
                            <th>Homepage</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(events ?? []).map((e) => (
                            <tr key={e.id}>
                                <td><Link href={`/portal/admin/events/${e.id}`} className="text-sky-deep font-semibold">{e.title}</Link></td>
                                <td className="text-xs">{formatEventTime(e.starts_at)}</td>
                                <td>{e.capacity ?? "Unlimited"}</td>
                                <td>
                                    <span className={`tag ${e.applications_locked ? "tag-outline" : "tag-lime"}`}>
                                        {e.applications_locked ? "Locked" : "Open"}
                                    </span>
                                </td>
                                <td>
                                    {e.promote_on_home ? <span className="tag tag-pink">Promoted</span> : <span className="text-ink-faint text-xs">&mdash;</span>}
                                </td>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <LockToggle eventId={e.id} locked={e.applications_locked} />
                                        <Link href={`/portal/admin/events?edit=${e.id}`} className="text-sm text-sky-deep font-semibold underline underline-offset-2">
                                            Edit
                                        </Link>
                                        <DeleteEventButton eventId={e.id} title={e.title} rsvpCount={counts.get(e.id) ?? 0} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!events?.length && (
                            <tr><td colSpan={6} className="text-ink-faint text-sm">No events yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="event-card">
                <div className="event-card-body">
                    <EventForm event={editing} />
                </div>
            </div>
        </div>
    );
}
