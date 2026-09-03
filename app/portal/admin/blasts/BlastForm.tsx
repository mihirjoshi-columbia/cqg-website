"use client";

import { useActionState, useState } from "react";
import { createBlastAction, type BlastFormState } from "./actions";
import type { CqgEvent } from "@/lib/supabase/types";

const initialState: BlastFormState = {};

export default function BlastForm({ events }: { events: CqgEvent[] }) {
    const [state, formAction, pending] = useActionState(createBlastAction, initialState);
    const [segmentType, setSegmentType] = useState("cqg_tier");
    const [timing, setTiming] = useState("now");

    return (
        <form action={formAction} className="flex flex-col gap-4">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Blast created.</div>}

            <div className="field">
                <label className="field-label">Subject</label>
                <input className="field-input" name="subject" type="text" required />
            </div>

            <div className="field">
                <label className="field-label">Body</label>
                <textarea className="field-textarea" name="body" required rows={6} placeholder={"Hi {{name}},\n\nWrite your message here..."} />
                <span className="field-hint">Plain text, blank line = new paragraph. Use {"{{name}}"} to personalize.</span>
            </div>

            <div className="field">
                <label className="field-label">Send to</label>
                <select
                    className="field-select"
                    name="segment_type"
                    value={segmentType}
                    onChange={(e) => setSegmentType(e.target.value)}
                >
                    <option value="cqg_tier">CQG tier group</option>
                    <option value="cutc_group">CUTC group</option>
                    <option value="event_group">Event group</option>
                </select>
            </div>

            {segmentType === "cqg_tier" && (
                <div className="field">
                    <label className="field-label">Tier</label>
                    <select className="field-select" name="cqg_tier" defaultValue="all">
                        <option value="all">All CQG accounts</option>
                        <option value="general_body">General Body</option>
                        <option value="member">Internal Members</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            )}

            {segmentType === "cutc_group" && (
                <div className="field">
                    <label className="field-label">CUTC status</label>
                    <select className="field-select" name="cutc_status" defaultValue="all">
                        <option value="all">All CUTC accounts</option>
                        <option value="pending">Pending applicants</option>
                        <option value="approved">Accepted applicants</option>
                        <option value="rejected">Rejected applicants</option>
                    </select>
                </div>
            )}

            {segmentType === "event_group" && (
                <>
                    <div className="field">
                        <label className="field-label">Event</label>
                        <select className="field-select" name="event_id" required>
                            <option value="">Select an event</option>
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label className="field-label">Which applicants</label>
                        <select className="field-select" name="event_which" defaultValue="applied">
                            <option value="applied">Applied (any non-withdrawn status)</option>
                            <option value="attended">Attended</option>
                        </select>
                    </div>
                </>
            )}

            <div className="field">
                <label className="field-label">Timing</label>
                <select className="field-select" name="timing" value={timing} onChange={(e) => setTiming(e.target.value)}>
                    <option value="now">Send now</option>
                    <option value="schedule">Schedule for later</option>
                </select>
            </div>

            {timing === "schedule" && (
                <div className="field">
                    <label className="field-label">Send at</label>
                    <input className="field-input" name="scheduled_at" type="datetime-local" required />
                    <span className="field-hint">Server&apos;s local timezone.</span>
                </div>
            )}

            <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
                {pending ? "Sending…" : timing === "now" ? "Send blast" : "Schedule blast"}
            </button>
        </form>
    );
}
