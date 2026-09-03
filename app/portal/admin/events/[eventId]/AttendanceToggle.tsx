"use client";

import { useTransition } from "react";
import { setEventAttendanceAction } from "./actions";

export default function AttendanceToggle({
    applicationId,
    eventId,
    attended,
}: {
    applicationId: string;
    eventId: string;
    attended: boolean;
}) {
    const [pending, startTransition] = useTransition();

    return (
        <button
            type="button"
            onClick={() => startTransition(() => setEventAttendanceAction(applicationId, !attended, eventId))}
            disabled={pending}
            className={`btn-cqg btn-sm ${attended ? "btn-lime" : "btn-outline-navy"}`}
        >
            {pending ? "…" : attended ? "Attended ✓" : "Mark attended"}
        </button>
    );
}
