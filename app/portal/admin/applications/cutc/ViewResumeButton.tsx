"use client";

import { useState } from "react";
import { getApplicantResumeUrlAction } from "./actions";
import { openBlankTab, showUrlInTab, closeTab } from "@/lib/browser/open-tab";

export default function ViewResumeButton({
    applicantType,
    cqgProfileId,
    cutcProfileId,
}: {
    applicantType: "cqg_member" | "external";
    cqgProfileId: string | null;
    cutcProfileId: string | null;
}) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        const newTab = openBlankTab();
        const result = await getApplicantResumeUrlAction(applicantType, cqgProfileId, cutcProfileId);
        setLoading(false);
        if (result.url) {
            showUrlInTab(newTab, result.url);
        } else {
            closeTab(newTab);
            alert(result.error || "Could not open resume.");
        }
    }

    return (
        <button type="button" onClick={handleClick} className="text-pink-deep font-semibold text-sm underline underline-offset-2" disabled={loading}>
            {loading ? "Opening…" : "Resume"}
        </button>
    );
}
