import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import LockToggle from "../LockToggle";
import DecideButtons from "./DecideButtons";
import AttendanceToggle from "./AttendanceToggle";
import type { CqgEvent, CqgEventApplication, CqgProfile } from "@/lib/supabase/types";

export const metadata = { title: "Event — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    accepted: "tag-lime",
    waitlisted: "tag-outline",
    rejected: "tag-outline",
    withdrawn: "tag-outline",
};

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const { supabase } = await requireAdmin();

    const { data: event } = await supabase
        .from("cqg_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle()
        .overrideTypes<CqgEvent, { merge: false }>();

    if (!event) {
        notFound();
    }

    const { data: applications } = await supabase
        .from("cqg_event_applications")
        .select("*")
        .eq("event_id", eventId)
        .order("applied_at", { ascending: true })
        .overrideTypes<CqgEventApplication[], { merge: false }>();

    const apps = applications ?? [];
    const profileIds = [...new Set(apps.map((a) => a.profile_id))];
    const { data: profiles } = profileIds.length
        ? await supabase
              .from("cqg_profiles")
              .select("*")
              .in("id", profileIds)
              .overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const accepted = apps.filter((a) => a.status === "accepted");
    const pending = apps.filter((a) => a.status === "pending");
    const waitlisted = apps.filter((a) => a.status === "waitlisted");
    const other = apps.filter((a) => a.status === "rejected" || a.status === "withdrawn");

    function renderRow(app: CqgEventApplication, showDecide: boolean, showAttendance: boolean) {
        const p = profileMap.get(app.profile_id);
        return (
            <tr key={app.id}>
                <td>{p ? `${p.name} — ${p.email}` : app.profile_id}</td>
                <td>{p ? `${p.school}${p.grad_program ? ` (${p.grad_program})` : ""}` : "—"}</td>
                <td><span className={`tag ${STATUS_TAG[app.status]}`}>{app.status}</span></td>
                <td>
                    {showDecide && <DecideButtons applicationId={app.id} eventId={eventId} />}
                    {showAttendance && (
                        <AttendanceToggle applicationId={app.id} eventId={eventId} attended={app.attended} />
                    )}
                </td>
            </tr>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="event-card" style={{ maxWidth: 640 }}>
                <div className="event-card-body">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h2 className="font-display font-bold text-xl text-navy">{event!.title}</h2>
                        <LockToggle eventId={event!.id} locked={event!.applications_locked} />
                    </div>
                    <p className="text-ink-soft text-sm">{event!.description}</p>
                    <div className="text-ink-faint text-xs flex flex-col gap-1">
                        <span>{new Date(event!.starts_at).toLocaleString()}{event!.location ? ` — ${event!.location}` : ""}</span>
                        <span>Capacity: {event!.capacity ?? "Unlimited"} · Accepted: {accepted.length}</span>
                    </div>
                </div>
            </div>

            {pending.length > 0 && (
                <section>
                    <h3 className="eyebrow mb-3 block">Pending review ({pending.length})</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead><tr><th>Applicant</th><th>School</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>{pending.map((a) => renderRow(a, true, false))}</tbody>
                        </table>
                    </div>
                </section>
            )}

            <section>
                <h3 className="eyebrow mb-3 block">Accepted ({accepted.length})</h3>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead><tr><th>Applicant</th><th>School</th><th>Status</th><th>Attendance</th></tr></thead>
                        <tbody>
                            {accepted.map((a) => renderRow(a, false, true))}
                            {!accepted.length && <tr><td colSpan={4} className="text-ink-faint text-sm">No one accepted yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            {waitlisted.length > 0 && (
                <section>
                    <h3 className="eyebrow mb-3 block">Waitlisted ({waitlisted.length})</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead><tr><th>Applicant</th><th>School</th><th>Status</th><th></th></tr></thead>
                            <tbody>{waitlisted.map((a) => renderRow(a, false, false))}</tbody>
                        </table>
                    </div>
                </section>
            )}

            {other.length > 0 && (
                <section>
                    <h3 className="eyebrow mb-3 block">Rejected / withdrawn ({other.length})</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead><tr><th>Applicant</th><th>School</th><th>Status</th><th></th></tr></thead>
                            <tbody>{other.map((a) => renderRow(a, false, false))}</tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
