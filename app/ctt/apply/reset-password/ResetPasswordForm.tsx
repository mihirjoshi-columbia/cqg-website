"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm() {
    const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-5">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}

            <div className="field">
                <label className="field-label" htmlFor="password">New password</label>
                <input className="field-input" id="password" name="password" type="password" required minLength={8} />
            </div>

            <div className="field">
                <label className="field-label" htmlFor="confirm">Confirm new password</label>
                <input className="field-input" id="confirm" name="confirm" type="password" required minLength={8} />
            </div>

            <button type="submit" className="btn-cqg btn-pink" disabled={pending}>
                {pending ? "Updating…" : "Update password →"}
            </button>
        </form>
    );
}
