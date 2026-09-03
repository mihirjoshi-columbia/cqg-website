"use client";

import { useTransition } from "react";
import { decideEventApplicationAction } from "./actions";

export default function DecideButtons({ applicationId, eventId }: { applicationId: string; eventId: string }) {
    const [pending, startTransition] = useTransition();

    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => startTransition(() => decideEventApplicationAction(applicationId, true, eventId))}
                disabled={pending}
                className="btn-cqg btn-lime btn-sm"
            >
                Approve
            </button>
            <button
                type="button"
                onClick={() => startTransition(() => decideEventApplicationAction(applicationId, false, eventId))}
                disabled={pending}
                className="btn-cqg btn-outline-navy btn-sm"
            >
                Reject
            </button>
        </div>
    );
}
