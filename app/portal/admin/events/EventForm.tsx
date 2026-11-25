"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createEventAction, updateEventAction, type EventFormState } from "./actions";
import { isoToEasternLocal } from "@/lib/events";
import type { CqgEvent } from "@/lib/supabase/types";

const initialState: EventFormState = {};

// Create a new event, or edit an existing one when `event` is passed.
export default function EventForm({ event }: { event?: CqgEvent }) {
    const [state, formAction, pending] = useActionState(event ? updateEventAction : createEventAction, initialState);
    const [promote, setPromote] = useState(event?.promote_on_home ?? false);

    return (
        <form action={formAction} className="flex flex-col gap-3" key={event?.id ?? "new"}>
            <h2 className="font-display font-bold text-navy">{event ? "Edit event" : "New event"}</h2>
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Event created.</div>}
            {event && <input type="hidden" name="event_id" value={event.id} />}

            <div className="field">
                <label className="field-label">Title</label>
                <input className="field-input" name="title" type="text" required defaultValue={event?.title} />
            </div>
            <div className="field">
                <label className="field-label">Description</label>
                <textarea className="field-textarea" name="description" defaultValue={event?.description} />
            </div>
            <div className="field">
                <label className="field-label">Location</label>
                <input className="field-input" name="location" type="text" defaultValue={event?.location} />
            </div>
            <div className="field">
                <label className="field-label">Starts (Eastern time)</label>
                <input
                    className="field-input"
                    name="starts_at"
                    type="datetime-local"
                    required
                    defaultValue={event ? isoToEasternLocal(event.starts_at) : undefined}
                />
            </div>
            <div className="field">
                <label className="field-label">Ends (Eastern time, optional)</label>
                <input
                    className="field-input"
                    name="ends_at"
                    type="datetime-local"
                    defaultValue={event?.ends_at ? isoToEasternLocal(event.ends_at) : undefined}
                />
            </div>
            <div className="field">
                <label className="field-label">Capacity (optional)</label>
                <input
                    className="field-input"
                    name="capacity"
                    type="number"
                    min={1}
                    placeholder="Leave blank for unlimited"
                    defaultValue={event?.capacity ?? undefined}
                />
            </div>
            <div className="field">
                <label className="field-label">Open to</label>
                <select className="field-input" name="eligibility" defaultValue={event?.eligibility ?? "all"}>
                    <option value="all">Undergraduate &amp; graduate students</option>
                    <option value="undergraduate">Undergraduates only</option>
                    <option value="graduate">Graduate students only</option>
                </select>
                <p className="text-ink-faint text-xs mt-1">Enforced when someone RSVPs, using the school on their account.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="instant_rsvp" defaultChecked={event?.instant_rsvp} />
                Confirm RSVPs instantly (anyone with a CQG account)
            </label>

            <div className="flex flex-col gap-3 border-t border-line pt-3">
                <label className="flex items-center gap-2 text-sm text-navy font-semibold">
                    <input type="checkbox" name="promote_on_home" checked={promote} onChange={(e) => setPromote(e.target.checked)} />
                    Promote on homepage
                </label>
                <p className="text-ink-faint text-xs -mt-2">
                    Adds a homepage banner, hero button, dashboard card and sign-up guide until the event ends (or 3 hours after it starts, if there&apos;s no end time) or RSVPs are locked.
                </p>
                {promote && (
                    <>
                        <div className="field">
                            <label className="field-label">Banner text</label>
                            <input
                                className="field-input"
                                name="promo_banner_text"
                                type="text"
                                placeholder="RSVP: the inaugural Columbia Quant Fair"
                                defaultValue={event?.promo_banner_text ?? undefined}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">Hero button label</label>
                            <input
                                className="field-input"
                                name="promo_button_label"
                                type="text"
                                placeholder="RSVP to the Columbia Quant Fair · Dec 5"
                                defaultValue={event?.promo_button_label ?? undefined}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">Audience line (optional)</label>
                            <input
                                className="field-input"
                                name="promo_audience"
                                type="text"
                                placeholder="Columbia & Barnard students"
                                defaultValue={event?.promo_audience ?? undefined}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">Banner color</label>
                            <select className="field-input" name="promo_color" defaultValue={event?.promo_color ?? "pink"}>
                                <option value="pink">Pink</option>
                                <option value="lime">Lime</option>
                                <option value="sky">Sky blue</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button type="submit" className="btn-cqg btn-lime btn-sm w-fit" disabled={pending}>
                    {pending ? "Saving…" : event ? "Save changes" : "Create event"}
                </button>
                {event && (
                    <Link href="/portal/admin/events" className="text-sm text-ink-soft underline underline-offset-2">
                        Cancel
                    </Link>
                )}
            </div>
        </form>
    );
}
