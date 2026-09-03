"use client";

import { useActionState } from "react";
import { createEventAction, type EventFormState } from "./actions";

const initialState: EventFormState = {};

export default function EventForm() {
    const [state, formAction, pending] = useActionState(createEventAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-3">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Event created.</div>}

            <div className="field">
                <label className="field-label">Title</label>
                <input className="field-input" name="title" type="text" required />
            </div>
            <div className="field">
                <label className="field-label">Description</label>
                <textarea className="field-textarea" name="description" />
            </div>
            <div className="field">
                <label className="field-label">Location</label>
                <input className="field-input" name="location" type="text" />
            </div>
            <div className="field">
                <label className="field-label">Starts</label>
                <input className="field-input" name="starts_at" type="datetime-local" required />
            </div>
            <div className="field">
                <label className="field-label">Ends (optional)</label>
                <input className="field-input" name="ends_at" type="datetime-local" />
            </div>
            <div className="field">
                <label className="field-label">Capacity (optional)</label>
                <input className="field-input" name="capacity" type="number" min={1} placeholder="Leave blank for unlimited" />
            </div>
            <button type="submit" className="btn-cqg btn-lime btn-sm w-fit" disabled={pending}>
                {pending ? "Creating…" : "Create event"}
            </button>
        </form>
    );
}
