"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, resendVerificationAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
    const [state, formAction, pending] = useActionState(loginAction, initialState);
    const [resendState, resendAction, resending] = useActionState(
        resendVerificationAction,
        initialState
    );
    const params = useSearchParams();
    const next = params.get("next") || "/cutc/apply/dashboard";
    const justSignedUp = params.get("justSignedUp") === "1";

    return (
        <div className="flex flex-col gap-4">
            <form action={formAction} className="flex flex-col gap-5">
                {justSignedUp && !state.error && (
                    <div className="form-banner form-banner-success">
                        Account created — check your email for a verification link before logging in.
                    </div>
                )}
                {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
                {resendState.resent && (
                    <div className="form-banner form-banner-success">
                        New verification link sent — check your inbox.
                    </div>
                )}
                {resendState.error && !resendState.resent && (
                    <div className="form-banner form-banner-error">{resendState.error}</div>
                )}

                <input type="hidden" name="next" value={next} />

                <div className="field">
                    <label className="field-label" htmlFor="email">Email</label>
                    <input className="field-input" id="email" name="email" type="email" required />
                </div>

                <div className="field">
                    <label className="field-label" htmlFor="password">Password</label>
                    <input className="field-input" id="password" name="password" type="password" required />
                </div>

                <button type="submit" className="btn-cqg btn-pink" disabled={pending}>
                    {pending ? "Logging in…" : "Log in →"}
                </button>

                <div className="flex justify-between text-sm">
                    <Link href="/cutc/apply/forgot-password" className="text-pink-deep font-semibold">Forgot password?</Link>
                    <Link href="/cutc/apply/signup" className="text-pink-deep font-semibold">Create account</Link>
                </div>
            </form>

            {/* Separate form: a nested <form> is invalid HTML, and this has to
                post the unverified address rather than the login fields. */}
            {state.unverifiedEmail && !resendState.resent && (
                <form action={resendAction}>
                    <input type="hidden" name="email" value={state.unverifiedEmail} />
                    <button type="submit" className="btn-cqg btn-outline-navy btn-sm w-full" disabled={resending}>
                        {resending ? "Sending…" : "Resend verification email"}
                    </button>
                </form>
            )}
        </div>
    );
}
