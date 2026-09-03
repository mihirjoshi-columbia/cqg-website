"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileUpdateState } from "./actions";
import type { CutcProfile } from "@/lib/supabase/types";

const initialState: ProfileUpdateState = {};

export default function ProfileForm({ profile }: { profile: CutcProfile }) {
    const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-4">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Profile updated.</div>}

            <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <input className="field-input" id="name" name="name" type="text" defaultValue={profile.name} required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="school">School</label>
                <input className="field-input" id="school" name="school" type="text" defaultValue={profile.school} required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="year">Class year</label>
                <input className="field-input" id="year" name="year" type="text" defaultValue={profile.year} required />
            </div>

            <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
            </button>
        </form>
    );
}
