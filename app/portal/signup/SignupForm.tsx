"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupForm() {
    const [state, formAction, pending] = useActionState(signupAction, initialState);
    const [school, setSchool] = useState("");

    return (
        <form action={formAction} className="flex flex-col gap-5">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}

            <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <input className="field-input" id="name" name="name" type="text" required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="email">Columbia / Barnard email</label>
                <input className="field-input" id="email" name="email" type="email" required placeholder="you@columbia.edu" />
                <span className="field-hint">Must end in columbia.edu or barnard.edu</span>
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
                    <input className="field-input" id="grad_program" name="grad_program" type="text" placeholder="e.g. MS Financial Engineering" />
                </div>
            )}

            <div className="field">
                <label className="field-label" htmlFor="year">Class year</label>
                <input className="field-input" id="year" name="year" type="text" required placeholder="e.g. 2028" />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="major">Major / concentration</label>
                <input className="field-input" id="major" name="major" type="text" required />
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
