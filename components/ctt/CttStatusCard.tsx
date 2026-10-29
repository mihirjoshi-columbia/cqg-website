"use client";

import { useEffect, useState, type ReactNode } from "react";
import { respondToCttOfferAction } from "@/lib/ctt-offer-actions";
import type { CttApplicationStatus } from "@/lib/supabase/types";

function formatRemaining(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

function formatDeadline(iso: string): string {
    return (
        new Date(iso).toLocaleString("en-US", {
            timeZone: "America/New_York",
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }) + " ET"
    );
}

// CTT is December 5-6, the same day as the Putnam exam.
const PUTNAM_NOTE = "Please note: the Putnam exam is on December 5th, so if you're taking the exam, you unfortunately can't attend our competition.";

const COPY: Record<string, { tag: string; label: string; body: (cycle: string) => string }> = {
    pending: {
        tag: "tag-sky",
        label: "Application pending",
        body: (cycle) => `Your application to ${cycle} is in — we'll email you once it's been reviewed.`,
    },
    accepted: {
        tag: "tag-pink",
        label: "Accepted",
        body: () => `You're in! We'll follow up with logistics closer to the event. ${PUTNAM_NOTE}`,
    },
    approved: {
        tag: "tag-pink",
        label: "Accepted",
        body: () => "Congrats — you're in. We'll follow up with logistics closer to the event.",
    },
    declined: {
        tag: "tag-outline",
        label: "Declined",
        body: () => "You declined your spot. If that was a mistake, reply to our email and we'll see what we can do.",
    },
    expired: {
        tag: "tag-outline",
        label: "Offer expired",
        body: () => "Your 24 hours to accept have passed, so the spot has been released. Reply to our email if you think this is a mistake.",
    },
    rejected: {
        tag: "tag-outline",
        label: "Not selected this cycle",
        body: () => "You weren't selected this cycle. You're welcome to apply again next time applications open.",
    },
};

export interface CttStatusCardProps {
    applicationId: string;
    status: CttApplicationStatus;
    offerExpiresAt: string | null;
    cycleLabel: string;
    children?: ReactNode;
}

// Shows where an application stands. For an open offer it shows the countdown and the
// Accept / Decline buttons; once the deadline passes the card flips to "expired" on its own.
export default function CttStatusCard({ applicationId, status, offerExpiresAt, cycleLabel, children }: CttStatusCardProps) {
    const expiresMs = offerExpiresAt ? new Date(offerExpiresAt).getTime() : 0;
    const [now, setNow] = useState(() => Date.now());
    const [outcome, setOutcome] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (status !== "offered") return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [status]);

    // What to show: the live outcome after answering, "expired" once the clock runs out, else the stored status.
    let shown: string = outcome ?? status;
    if (shown === "offered" && expiresMs && now >= expiresMs) shown = "expired";

    async function respond(accept: boolean) {
        if (!accept && !window.confirm("Decline your spot? Someone else will be offered it.")) return;
        setBusy(true);
        setError(null);
        const result = await respondToCttOfferAction(applicationId, accept);
        setBusy(false);
        if (result.error) setError(result.error);
        else if (result.status) setOutcome(result.status);
    }

    if (shown === "offered") {
        return (
            <div className="event-card" style={{ maxWidth: 560 }}>
                <div className="event-card-body">
                    <span className="tag tag-lime w-fit">You&apos;re accepted!</span>
                    <p className="text-ink-soft text-sm">
                        Congratulations — you&apos;ve been accepted to CTT (December 5–6, 2026, Low Library). Accept your spot
                        by <strong>{offerExpiresAt ? formatDeadline(offerExpiresAt) : "the deadline"}</strong>, or it will be offered to
                        someone else.
                    </p>
                    <p className="text-ink-soft text-sm">{PUTNAM_NOTE}</p>
                    <p className="text-sm font-semibold text-navy tabular-nums" suppressHydrationWarning>
                        Time left: {formatRemaining(expiresMs - now)}
                    </p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => respond(true)} disabled={busy} className="btn-cqg btn-pink btn-sm">
                            {busy ? "Saving…" : "Accept my spot"}
                        </button>
                        <button type="button" onClick={() => respond(false)} disabled={busy} className="btn-cqg btn-outline-navy btn-sm">
                            Decline
                        </button>
                    </div>
                    {error && <p className="text-xs" style={{ color: "#C23B4A" }}>{error}</p>}
                </div>
            </div>
        );
    }

    const copy = COPY[shown] ?? COPY.pending;
    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className={`tag ${copy.tag} w-fit`}>{copy.label}</span>
                <p className="text-ink-soft text-sm">{copy.body(cycleLabel)}</p>
                {children}
            </div>
        </div>
    );
}
