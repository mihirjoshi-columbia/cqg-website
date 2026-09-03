"use client";

import { useFormStatus } from "react-dom";

export default function ApplyButton({
    label = "Apply for Internal Membership",
    className = "btn-lime",
}: {
    label?: string;
    className?: string;
}) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className={`btn-cqg ${className} btn-sm w-fit`} disabled={pending}>
            {pending ? "Submitting…" : label}
        </button>
    );
}
