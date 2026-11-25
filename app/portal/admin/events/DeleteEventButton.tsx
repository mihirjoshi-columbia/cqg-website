"use client";

import { useTransition } from "react";
import { deleteEventAction } from "./actions";

export default function DeleteEventButton({ eventId, title, rsvpCount }: { eventId: string; title: string; rsvpCount: number }) {
    const [pending, startTransition] = useTransition();

    function onClick() {
        const detail =
            rsvpCount > 0
                ? `It has ${rsvpCount} RSVP${rsvpCount === 1 ? "" : "s"}/application${rsvpCount === 1 ? "" : "s"}, which will be deleted with it.`
                : "It has no RSVPs yet.";
        if (!window.confirm(`Delete "${title}"? ${detail} This cannot be undone.`)) return;
        startTransition(async () => {
            const result = await deleteEventAction(eventId);
            if (result?.error) window.alert(result.error);
        });
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="text-sm text-[#C23B4A] font-semibold underline underline-offset-2"
        >
            {pending ? "…" : "Delete"}
        </button>
    );
}
