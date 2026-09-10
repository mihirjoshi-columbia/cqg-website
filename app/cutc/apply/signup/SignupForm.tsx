"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupForm() {
    const [state, formAction, pending] = useActionState(signupAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-5">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}

            <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <input className="field-input" id="name" name="name" type="text" required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="email">School email</label>
                <input className="field-input" id="email" name="email" type="email" required placeholder="you@university.edu" />
                <span className="field-hint">
                    Any .edu email except columbia.edu / barnard.edu — Columbia and Barnard students apply from
                    their CQG portal account instead.
                </span>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <input className="field-input" id="password" name="password" type="password" required minLength={8} />
                <span className="field-hint">At least 8 characters</span>
            </div>

            <div className="field-checkbox-row">
                <input id="attestation" name="attestation" type="checkbox" required />
                <label htmlFor="attestation">
                    I am a current undergraduate at an accredited US institution.
                </label>
            </div>

            <div className="field-checkbox-row">
                <input id="agree" name="agree" type="checkbox" required />
                <label htmlFor="agree">
                    I agree to the CQG <Link href="/privacy-policy" className="text-pink-deep font-semibold">Privacy Policy</Link>.
                </label>
            </div>

            <button type="submit" className="btn-cqg btn-pink" disabled={pending}>
                {pending ? "Creating account…" : "Create account →"}
            </button>

            <p className="text-sm text-ink-faint text-center">
                Already have an account? <Link href="/cutc/apply/login" className="text-pink-deep font-semibold">Log in</Link>
            </p>
        </form>
    );
}
