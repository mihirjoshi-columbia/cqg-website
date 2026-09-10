"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";
import { CQG_MAJORS } from "@/lib/data/cqg-majors";
import { GRAD_PROGRAMS } from "@/lib/data/grad-programs";

const initialState: SignupState = {};

const YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function SignupForm() {
    const [state, formAction, pending] = useActionState(signupAction, initialState);
    const [school, setSchool] = useState("");
    const [major, setMajor] = useState("");
    const [gradProgram, setGradProgram] = useState("");

    return (
        <form action={formAction} className="flex flex-col gap-5">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}

            <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <input className="field-input" id="name" name="name" type="text" required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="email">Columbia / Barnard email</label>
                <input className="field-input" id="email" name="email" type="email" required placeholder="abc1234@columbia.edu" />
                <span className="field-hint">Must be your UNI address, e.g. abc1234@columbia.edu or xy6789@barnard.edu</span>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <input className="field-input" id="password" name="password" type="password" required minLength={8} />
                <span className="field-hint">At least 8 characters</span>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="school">School</label>
                <select
                    className="field-select"
                    id="school"
                    name="school"
                    required
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                >
                    <option value="" disabled>Select your school</option>
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
                        <option value="" disabled>Select your program</option>
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
                            required
                        />
                    )}
                </div>
            )}

            <div className="field">
                <label className="field-label" htmlFor="year">Class year</label>
                <select className="field-select" id="year" name="year" defaultValue="" required>
                    <option value="" disabled>Select a year</option>
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
                    <option value="" disabled>Select your major</option>
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
                        required
                    />
                )}
            </div>

            <div className="field">
                <label className="field-label" htmlFor="gender">Gender</label>
                <select className="field-select" id="gender" name="gender" defaultValue="" required>
                    <option value="" disabled>Select an option</option>
                    {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>

            <div className="field-checkbox-row">
                <input id="agree" name="agree" type="checkbox" required />
                <label htmlFor="agree">
                    I agree to the CQG <Link href="/privacy-policy" className="text-sky-deep font-semibold">Privacy Policy</Link>.
                </label>
            </div>

            <button type="submit" className="btn-cqg btn-lime" disabled={pending}>
                {pending ? "Creating account…" : "Create account →"}
            </button>

            <p className="text-sm text-ink-faint text-center">
                Already have an account? <Link href="/portal/login" className="text-sky-deep font-semibold">Log in</Link>
            </p>
        </form>
    );
}
