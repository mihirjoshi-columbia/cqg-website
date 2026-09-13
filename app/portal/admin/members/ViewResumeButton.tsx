"use client";

import { useState } from "react";
import { getMemberResumeUrlAction } from "./actions";
import { openBlankTab, showUrlInTab, closeTab } from "@/lib/browser/open-tab";

export default function ViewResumeButton({ profileId }: { profileId: string }) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        const newTab = openBlankTab();
        const result = await getMemberResumeUrlAction(profileId);
        setLoading(false);
        if (result.url) {
            showUrlInTab(newTab, result.url);
        } else {
            closeTab(newTab);
            alert(result.error || "Could not open resume.");
        }
    }

    return (
        <button type="button" onClick={handleClick} className="text-sky-deep font-semibold text-sm underline underline-offset-2" disabled={loading}>
            {loading ? "Opening…" : "Resume"}
        </button>
    );
}
