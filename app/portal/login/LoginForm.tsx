"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
    const [state, formAction, pending] = useActionState(loginAction, initialState);
    const params = useSearchParams();
    const next = params.get("next") || "/portal/dashboard";
    const justSignedUp = params.get("justSignedUp") === "1";

    return (
        <form action={formAction} className="flex flex-col gap-5">
            {justSignedUp && !state.error && (
                <div className="form-banner form-banner-success">
                    Account created — check your email for a verification link before logging in.
                </div>
            )}
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}

            <input type="hidden" name="next" value={next} />

            <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <input className="field-input" id="email" name="email" type="email" required />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <input className="field-input" id="password" name="password" type="password" required />
            </div>

            <button type="submit" className="btn-cqg btn-lime" disabled={pending}>
                {pending ? "Logging in…" : "Log in →"}
            </button>

            <div className="flex justify-between text-sm">
                <Link href="/portal/forgot-password" className="text-sky-deep font-semibold">Forgot password?</Link>
                <Link href="/portal/signup" className="text-sky-deep font-semibold">Create account</Link>
            </div>
        </form>
    );
}
