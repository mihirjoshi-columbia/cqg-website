"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
    const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

    if (state.submitted) {
        return (
            <div className="form-banner form-banner-success">
                If an account exists for that email, a reset link has been sent.
            </div>
        );
    }

    return (
        <form action={formAction} className="flex flex-col gap-5">
            <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <input className="field-input" id="email" name="email" type="email" required />
            </div>

            <button type="submit" className="btn-cqg btn-pink" disabled={pending}>
                {pending ? "Sending…" : "Send reset link →"}
            </button>

            <p className="text-sm text-ink-faint text-center">
                <Link href="/cutc/apply/login" className="text-pink-deep font-semibold">Back to login</Link>
            </p>
        </form>
    );
}
