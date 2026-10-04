"use client";

import { useActionState, useState } from "react";
import { uploadResumeAction, getResumeUrlAction, type ResumeUploadState } from "./actions";
import { openBlankTab, showUrlInTab, closeTab } from "@/lib/browser/open-tab";
import { RESUME_MAX_BYTES, RESUME_MAX_LABEL } from "@/lib/resume-file";

const initialState: ResumeUploadState = {};

export default function ResumeUpload({ hasResume }: { hasResume: boolean }) {
    const [state, formAction, pending] = useActionState(uploadResumeAction, initialState);
    const [viewing, setViewing] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [sizeError, setSizeError] = useState<string | null>(null);

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
            {sizeError && <div className="form-banner form-banner-error">{sizeError}</div>}

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
                    <input
                        className="field-input"
                        id="resume"
                        name="resume"
                        type="file"
                        accept="application/pdf,.pdf"
                        required
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size > RESUME_MAX_BYTES) {
                                setSizeError(
                                    `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — resumes must be under ${RESUME_MAX_LABEL}. Try exporting a smaller PDF.`
                                );
                                e.target.value = "";
                            } else {
                                setSizeError(null);
                            }
                        }}
                    />
                    <span className="field-hint">PDF only, {RESUME_MAX_LABEL} max</span>
                </div>
                <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
                    {pending ? "Uploading…" : "Upload"}
                </button>
            </form>
        </div>
    );
}
