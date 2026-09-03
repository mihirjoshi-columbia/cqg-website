import { requireAdmin } from "@/lib/admin";
import BlastForm from "./BlastForm";
import DispatchButton from "./DispatchButton";
import type { EmailBlast, CqgEvent } from "@/lib/supabase/types";

export const metadata = { title: "Email Blasts — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    draft: "tag-outline",
    scheduled: "tag-sky",
    sending: "tag-sky",
    sent: "tag-lime",
    failed: "tag-outline",
};

const SEGMENT_LABEL: Record<string, string> = {
    cqg_tier: "CQG tier",
    cutc_group: "CUTC group",
    event_group: "Event group",
};

export default async function AdminBlastsPage() {
    const { supabase } = await requireAdmin();

    const { data: blasts } = await supabase
        .from("email_blasts")
        .select("*")
        .order("created_at", { ascending: false })
        .overrideTypes<EmailBlast[], { merge: false }>();

    const { data: events } = await supabase
        .from("cqg_events")
        .select("*")
        .order("starts_at", { ascending: false })
        .overrideTypes<CqgEvent[], { merge: false }>();

    return (
        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(300px, 400px)" }}>
            <div style={{ overflowX: "auto" }}>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-ink-faint text-sm">{blasts?.length ?? 0} blasts</p>
                    <DispatchButton />
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Segment</th>
                            <th>Scheduled</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(blasts ?? []).map((b) => (
                            <tr key={b.id}>
                                <td>{b.subject}</td>
                                <td>{SEGMENT_LABEL[b.segment_type]}</td>
                                <td className="text-xs">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : "—"}</td>
                                <td><span className={`tag ${STATUS_TAG[b.status]}`}>{b.status}</span></td>
                            </tr>
                        ))}
                        {!blasts?.length && (
                            <tr><td colSpan={4} className="text-ink-faint text-sm">No blasts yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="event-card">
                <div className="event-card-body">
                    <BlastForm events={events ?? []} />
                </div>
            </div>
        </div>
    );
}
