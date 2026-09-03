"use client";

import { useFormStatus } from "react-dom";

export default function ApplyButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
            {pending ? "Submitting…" : "Apply to CUTC"}
        </button>
    );
}
