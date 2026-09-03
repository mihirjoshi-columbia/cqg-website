"use client";

import { useActionState } from "react";
import type { CycleFormState } from "./actions";

const initialState: CycleFormState = {};

export default function CycleForm({
    action,
    accent,
}: {
    action: (prev: CycleFormState, formData: FormData) => Promise<CycleFormState>;
    accent: "btn-lime" | "btn-pink";
}) {
    const [state, formAction, pending] = useActionState(action, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-3">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Cycle created.</div>}

            <div className="field">
                <label className="field-label">Label</label>
                <input className="field-input" name="label" type="text" required placeholder="e.g. Fall 2026 Internal Recruitment" />
            </div>
            <div className="field">
                <label className="field-label">Opens</label>
                <input className="field-input" name="opens_at" type="datetime-local" required />
            </div>
            <div className="field">
                <label className="field-label">Closes</label>
                <input className="field-input" name="closes_at" type="datetime-local" required />
                <span className="field-hint">Times are interpreted in the server&apos;s local timezone.</span>
            </div>
            <button type="submit" className={`btn-cqg ${accent} btn-sm w-fit`} disabled={pending}>
                {pending ? "Creating…" : "Create cycle"}
            </button>
        </form>
    );
}
