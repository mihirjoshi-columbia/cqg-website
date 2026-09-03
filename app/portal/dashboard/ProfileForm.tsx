"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileUpdateState } from "./actions";
import type { CqgProfile } from "@/lib/supabase/types";

const initialState: ProfileUpdateState = {};

export default function ProfileForm({ profile }: { profile: CqgProfile }) {
    const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
    const [school, setSchool] = useState(profile.school);

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
                <select
                    className="field-select"
                    id="school"
                    name="school"
                    required
                    value={school}
                    onChange={(e) => setSchool(e.target.value as CqgProfile["school"])}
                >
                    <option value="CC">Columbia College (CC)</option>
                    <option value="SEAS">Engineering (SEAS)</option>
                    <option value="Barnard">Barnard</option>
                    <option value="GS">General Studies (GS)</option>
                    <option value="GRAD">Graduate School</option>
                </select>
            </div>

            {school === "GRAD" && (
                <div className="field">
                    <label className="field-label" htmlFor="grad_program">Graduate program</label>
                    <input
                        className="field-input"
                        id="grad_program"
                        name="grad_program"
                        type="text"
                        defaultValue={profile.grad_program ?? ""}
                    />
                </div>
            )}

            <div className="field">
                <label className="field-label" htmlFor="year">Class year</label>
                <input className="field-input" id="year" name="year" type="text" defaultValue={profile.year} required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="major">Major / concentration</label>
                <input className="field-input" id="major" name="major" type="text" defaultValue={profile.major} required />
            </div>

            <button type="submit" className="btn-cqg btn-sky btn-sm w-fit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
            </button>
        </form>
    );
}
