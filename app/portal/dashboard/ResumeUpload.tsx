"use client";

import { useActionState, useState } from "react";
import { uploadResumeAction, getResumeUrlAction, type ResumeUploadState } from "./actions";
import { openBlankTab, showUrlInTab, closeTab } from "@/lib/browser/open-tab";

const initialState: ResumeUploadState = {};

export default function ResumeUpload({ hasResume }: { hasResume: boolean }) {
    const [state, formAction, pending] = useActionState(uploadResumeAction, initialState);
    const [viewing, setViewing] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);

    async function handleView() {
        setViewing(true);
        setViewError(null);
        const newTab = openBlankTab();
        const result = await getResumeUrlAction();
        setViewing(false);
        if (result.url) {
            showUrlInTab(newTab, result.url);
        } else {
            closeTab(newTab);
            setViewError(result.error || "Could not open resume.");
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {state.error && <div className="form-banner form-banner-error">{state.error}</div>}
            {state.success && <div className="form-banner form-banner-success">Resume uploaded.</div>}
            {viewError && <div className="form-banner form-banner-error">{viewError}</div>}

            {hasResume && (
                <button
                    type="button"
                    onClick={handleView}
                    className="btn-cqg btn-outline-navy btn-sm w-fit"
                    disabled={viewing}
                >
                    {viewing ? "Opening…" : "View current resume"}
                </button>
            )}

            <form action={formAction} className="flex flex-col gap-3">
                <div className="field">
                    <label className="field-label" htmlFor="resume">
                        {hasResume ? "Replace resume" : "Upload resume"}
                    </label>
                    <input className="field-input" id="resume" name="resume" type="file" accept="application/pdf" required />
                    <span className="field-hint">PDF only, 5MB max</span>
                </div>
                <button type="submit" className="btn-cqg btn-sky btn-sm w-fit" disabled={pending}>
                    {pending ? "Uploading…" : "Upload"}
                </button>
            </form>
        </div>
    );
}
