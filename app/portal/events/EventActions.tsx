"use client";

import { useState, useTransition } from "react";
import { applyToEventAction, withdrawFromEventAction } from "./actions";

const BUTTON_CLASS = { lime: "btn-lime", pink: "btn-pink", sky: "btn-sky" } as const;

export function ApplyButton({ eventId, label = "Apply", tone = "lime" }: { eventId: string; label?: string; tone?: "lime" | "pink" | "sky" }) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={() =>
                    startTransition(async () => {
                        setError(null);
                        const result = await applyToEventAction(eventId);
                        if (result?.error) setError(result.error);
                    })
                }
                disabled={pending}
                className={`btn-cqg ${BUTTON_CLASS[tone]} btn-sm`}
            >
                {pending ? "Saving…" : label}
            </button>
            {error && <p className="text-xs text-[#C23B4A] font-semibold max-w-[16rem] text-right">{error}</p>}
        </div>
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
