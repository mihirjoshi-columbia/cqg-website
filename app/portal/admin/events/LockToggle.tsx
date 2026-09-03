"use client";

import { useTransition } from "react";
import { toggleEventLockAction } from "./actions";

export default function LockToggle({ eventId, locked }: { eventId: string; locked: boolean }) {
    const [pending, startTransition] = useTransition();

    return (
        <button
            type="button"
            onClick={() => startTransition(() => toggleEventLockAction(eventId, !locked))}
            disabled={pending}
            className="btn-cqg btn-outline-navy btn-sm"
        >
            {pending ? "…" : locked ? "Unlock" : "Lock"}
        </button>
    );
}
