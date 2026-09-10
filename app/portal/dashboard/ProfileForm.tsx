"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileUpdateState } from "./actions";
import { CQG_MAJORS } from "@/lib/data/cqg-majors";
import { GRAD_PROGRAMS } from "@/lib/data/grad-programs";
import type { CqgProfile } from "@/lib/supabase/types";

const initialState: ProfileUpdateState = {};

const YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function ProfileForm({ profile }: { profile: CqgProfile }) {
    const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
    const [school, setSchool] = useState(profile.school);
    const [major, setMajor] = useState(CQG_MAJORS.includes(profile.major) ? profile.major : "Other");
    const [gradProgram, setGradProgram] = useState(
        profile.grad_program && GRAD_PROGRAMS.includes(profile.grad_program) ? profile.grad_program : "Other"
    );

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
                    <select
                        className="field-select"
                        id="grad_program"
                        name={gradProgram === "Other" ? undefined : "grad_program"}
                        required
                        value={gradProgram}
                        onChange={(e) => setGradProgram(e.target.value)}
                    >
                        {GRAD_PROGRAMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    {gradProgram === "Other" && (
                        <input
                            className="field-input mt-2"
                            type="text"
                            name="grad_program"
                            placeholder="Tell us your program"
                            defaultValue={
                                profile.grad_program && !GRAD_PROGRAMS.includes(profile.grad_program)
                                    ? profile.grad_program
                                    : ""
                            }
                            required
                        />
                    )}
                </div>
            )}

            <div className="field">
                <label className="field-label" htmlFor="year">Class year</label>
                <select
                    className="field-select"
                    id="year"
                    name="year"
                    defaultValue={YEARS.includes(profile.year) ? profile.year : ""}
                    required
                >
                    {!YEARS.includes(profile.year) && <option value="" disabled>Select a year</option>}
                    {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="major">Major / concentration</label>
                <select
                    className="field-select"
                    id="major"
                    name={major === "Other" ? undefined : "major"}
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                >
                    {CQG_MAJORS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                {major === "Other" && (
                    <input
                        className="field-input mt-2"
                        type="text"
                        name="major"
                        placeholder="Tell us your major"
                        defaultValue={CQG_MAJORS.includes(profile.major) ? "" : profile.major}
                        required
                    />
                )}
            </div>

            <div className="field">
                <label className="field-label" htmlFor="gender">Gender</label>
                <select
                    className="field-select"
                    id="gender"
                    name="gender"
                    defaultValue={profile.gender && GENDERS.includes(profile.gender) ? profile.gender : ""}
                    required
                >
                    <option value="" disabled>Select an option</option>
                    {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className="btn-cqg btn-sky btn-sm w-fit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
            </button>
        </form>
    );
}
