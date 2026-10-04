"use client";

import { useState } from "react";
import { deleteAccountAction } from "./actions";

export default function DangerZone() {
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-sm text-[#C23B4A] font-semibold underline underline-offset-2"
            >
                Delete my account
            </button>
        );
    }

    return (
        <form action={deleteAccountAction} className="flex flex-col gap-3 max-w-sm">
            <p className="text-sm text-ink-soft">
                This permanently deletes your profile, resume, and application history. Type{" "}
                <span className="font-mono font-semibold">DELETE</span> to confirm.
            </p>
            <input
                className="field-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
            />
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={confirmText !== "DELETE"}
                    className="btn-cqg btn-sm"
                    style={{ background: "#C23B4A", color: "#fff", opacity: confirmText !== "DELETE" ? 0.5 : 1 }}
                >
                    Permanently delete account
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setConfirming(false);
                        setConfirmText("");
                    }}
                    className="btn-cqg btn-outline-navy btn-sm"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
