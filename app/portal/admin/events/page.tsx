import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import EventForm from "./EventForm";
import LockToggle from "./LockToggle";
import type { CqgEvent } from "@/lib/supabase/types";

export const metadata = { title: "Events — CQG Admin" };

export default async function AdminEventsPage() {
    const { supabase } = await requireAdmin();

    const { data: events } = await supabase
        .from("cqg_events")
        .select("*")
        .order("starts_at", { ascending: false })
        .overrideTypes<CqgEvent[], { merge: false }>();

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
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(events ?? []).map((e) => (
                            <tr key={e.id}>
                                <td><Link href={`/portal/admin/events/${e.id}`} className="text-sky-deep font-semibold">{e.title}</Link></td>
                                <td className="text-xs">{new Date(e.starts_at).toLocaleString()}</td>
                                <td>{e.capacity ?? "Unlimited"}</td>
                                <td>
                                    <span className={`tag ${e.applications_locked ? "tag-outline" : "tag-lime"}`}>
                                        {e.applications_locked ? "Locked" : "Open"}
                                    </span>
                                </td>
                                <td><LockToggle eventId={e.id} locked={e.applications_locked} /></td>
                            </tr>
                        ))}
                        {!events?.length && (
                            <tr><td colSpan={5} className="text-ink-faint text-sm">No events yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="event-card">
                <div className="event-card-body">
                    <EventForm />
                </div>
            </div>
        </div>
    );
}
