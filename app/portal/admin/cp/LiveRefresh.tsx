"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-runs the server component every few seconds so the board stays live
 * without a socket. Pauses while the tab is hidden.
 */
export default function LiveRefresh({ seconds }: { seconds: number }) {
    const router = useRouter();
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    useEffect(() => {
        const tick = () => {
            if (document.visibilityState !== "visible") return;
            router.refresh();
            setUpdatedAt(new Date().toLocaleTimeString());
        };
        const id = setInterval(tick, seconds * 1000);
        return () => clearInterval(id);
    }, [router, seconds]);

    return (
        <span className="text-ink-faint text-xs font-mono">
            <span className="text-lime-deep">●</span> Live, every {seconds}s
            {updatedAt && <> · updated {updatedAt}</>}
        </span>
    );
}
