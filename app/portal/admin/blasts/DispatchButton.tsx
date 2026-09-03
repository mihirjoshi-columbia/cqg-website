"use client";

import { useTransition } from "react";
import { dispatchNowAction } from "./actions";

export default function DispatchButton() {
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            onClick={() => startTransition(() => dispatchNowAction())}
            disabled={pending}
            className="btn-cqg btn-outline-navy btn-sm"
        >
            {pending ? "Checking…" : "Run dispatch now"}
        </button>
    );
}
