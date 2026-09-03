"use client";

import { useTransition } from "react";
import { decideCutcApplicationAction } from "./actions";

export default function DecisionButtons({ applicationId }: { applicationId: string }) {
    const [pending, startTransition] = useTransition();

    function decide(decision: "approve" | "reject") {
        const fd = new FormData();
        fd.set("applicationId", applicationId);
        fd.set("decision", decision);
        startTransition(() => {
            decideCutcApplicationAction(fd);
        });
    }

    return (
        <div className="flex gap-2">
            <button type="button" onClick={() => decide("approve")} disabled={pending} className="btn-cqg btn-pink btn-sm">
                Approve
            </button>
            <button type="button" onClick={() => decide("reject")} disabled={pending} className="btn-cqg btn-outline-navy btn-sm">
                Reject
            </button>
        </div>
    );
}
