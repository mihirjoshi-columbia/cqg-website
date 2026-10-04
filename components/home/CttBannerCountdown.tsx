"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const nowMs = () => Date.now();

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days > 0 ? `${days}d ` : ""}${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function CttBannerCountdown({ closesAtIso, dueText }: { closesAtIso: string; dueText: string }) {
  const closesAtMs = new Date(closesAtIso).getTime();
  const [remaining, setRemaining] = useState(() => closesAtMs - nowMs());

  useEffect(() => {
    const tick = () => setRemaining(closesAtMs - nowMs());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAtMs]);

  // Applications have closed.
  if (remaining <= 0) return null;

  return (
    <Link
      href="/competition"
      className="sticky top-16 z-40 block bg-pink text-navy px-4 py-2.5 text-center hover:brightness-95 transition"
    >
      <span className="text-sm font-bold">CTT applications are open!</span>{" "}
      <span className="block sm:inline text-xs sm:text-sm font-semibold">
        Due {dueText} &middot;{" "}
        {/* Server HTML is built minutes earlier than the client renders, so the digits legitimately differ. */}
        <span className="tabular-nums" suppressHydrationWarning>
          {formatRemaining(remaining)}
        </span>{" "}
        left <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
