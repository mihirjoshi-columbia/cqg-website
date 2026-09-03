"use client";

import { useTransition } from "react";
import { applyToEventAction, withdrawFromEventAction } from "./actions";

export function ApplyButton({ eventId }: { eventId: string }) {
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            onClick={() => startTransition(() => applyToEventAction(eventId))}
            disabled={pending}
            className="btn-cqg btn-lime btn-sm"
        >
            {pending ? "Applying…" : "Apply"}
        </button>
    );
}

export function WithdrawButton({ applicationId }: { applicationId: string }) {
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            onClick={() => startTransition(() => withdrawFromEventAction(applicationId))}
            disabled={pending}
            className="text-sm text-[#C23B4A] font-semibold underline underline-offset-2"
        >
            {pending ? "…" : "Withdraw"}
        </button>
    );
}
