"use client";

import { useState } from "react";
import { getMemberResumeUrlAction } from "./actions";

export default function ViewResumeButton({ profileId }: { profileId: string }) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        const newTab = window.open("", "_blank", "noopener,noreferrer");
        const result = await getMemberResumeUrlAction(profileId);
        setLoading(false);
        if (result.url && newTab) {
            newTab.location.href = result.url;
        } else {
            newTab?.close();
            alert(result.error || "Could not open resume.");
        }
    }

    return (
        <button type="button" onClick={handleClick} className="text-sky-deep font-semibold text-sm underline underline-offset-2" disabled={loading}>
            {loading ? "Opening…" : "Resume"}
        </button>
    );
}
