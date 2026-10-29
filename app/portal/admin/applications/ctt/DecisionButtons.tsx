"use client";

import { useState, useTransition } from "react";
import { decideCttApplicationAction, offerCttSpotAction, setCttOfferOutcomeAction } from "./actions";
import type { CttApplicationStatus } from "@/lib/supabase/types";

export default function DecisionButtons({
    applicationId,
    status,
    offerExpiresAt,
}: {
    applicationId: string;
    status: CttApplicationStatus;
    offerExpiresAt: string | null;
}) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function reject() {
        const fd = new FormData();
        fd.set("applicationId", applicationId);
        fd.set("decision", "reject");
        startTransition(() => {
            decideCttApplicationAction(fd);
        });
    }

    function offer() {
        if (!window.confirm("Offer this applicant a spot? This starts their 24-hour clock and emails them now.")) return;
        setError(null);
        startTransition(async () => {
            const result = await offerCttSpotAction(applicationId);
            if (!result.ok) setError(result.error ?? "Couldn't make the offer.");
        });
    }

    function outcome(value: "accepted" | "declined") {
        startTransition(() => {
            setCttOfferOutcomeAction(applicationId, value);
        });
    }

    if (status === "pending") {
        return (
            <div>
                <div className="flex gap-2">
                    <button type="button" onClick={offer} disabled={pending} className="btn-cqg btn-pink btn-sm">
                        Offer spot
                    </button>
                    <button type="button" onClick={reject} disabled={pending} className="btn-cqg btn-outline-navy btn-sm">
                        Reject
                    </button>
                </div>
                {error && <p className="text-xs mt-1" style={{ color: "#C23B4A" }}>{error}</p>}
            </div>
        );
    }

    if (status === "offered") {
        return (
            <div>
                <p className="text-ink-faint text-xs mb-1">
                    Expires {offerExpiresAt ? new Date(offerExpiresAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET" : "—"}
                </p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => outcome("accepted")} disabled={pending} className="btn-cqg btn-outline-navy btn-sm">
                        Mark accepted
                    </button>
                    <button type="button" onClick={() => outcome("declined")} disabled={pending} className="btn-cqg btn-outline-navy btn-sm">
                        Mark declined
                    </button>
                </div>
            </div>
        );
    }

    if (status === "expired" || status === "declined") {
        return (
            <div>
                <button type="button" onClick={offer} disabled={pending} className="btn-cqg btn-outline-navy btn-sm">
                    Re-offer
                </button>
                {error && <p className="text-xs mt-1" style={{ color: "#C23B4A" }}>{error}</p>}
            </div>
        );
    }

    return <span className="text-ink-faint text-xs">—</span>;
}
