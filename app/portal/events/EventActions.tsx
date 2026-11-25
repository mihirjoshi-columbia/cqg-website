"use client";

import { useTransition } from "react";
import { applyToEventAction, withdrawFromEventAction } from "./actions";

export function ApplyButton({ eventId, label = "Apply", tone = "lime" }: { eventId: string; label?: string; tone?: "lime" | "pink" }) {
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            onClick={() => startTransition(() => applyToEventAction(eventId))}
            disabled={pending}
            className={`btn-cqg ${tone === "pink" ? "btn-pink" : "btn-lime"} btn-sm`}
        >
            {pending ? "Saving…" : label}
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
            className="self-start text-left text-sm text-[#C23B4A] font-semibold underline underline-offset-2"
        >
            {pending ? "…" : "Withdraw"}
        </button>
    );
}
