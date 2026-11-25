"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COLOR_STYLES } from "@/lib/events";
import type { PromoEvent } from "@/lib/promo-events";

const ROTATE_MS = 5000;

// RSVP banner for the events flagged "promote on homepage" in the admin. With more than one
// live event the banner rotates between them (paused while hovered or focused, and not
// rotating at all for people who prefer reduced motion).
export default function EventBanner({ events }: { events: PromoEvent[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = events.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;
  const active = index % count;

  return (
    <div
      className="promo-banner sticky top-16 z-40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Every slide sits in the same grid cell, so the banner keeps the height of the tallest one. */}
      <div className="grid">
        {events.map((event, i) => (
          <Link
            key={event.id}
            href={event.href}
            aria-hidden={i !== active}
            tabIndex={i === active ? 0 : -1}
            className={`${COLOR_STYLES[event.color].bg} text-navy px-4 py-2.5 ${count > 1 ? "pb-4" : ""} text-center hover:brightness-95 transition-opacity duration-300 lg:flex lg:min-h-10 lg:items-center lg:justify-center lg:gap-1.5 lg:py-0 lg:pb-0 [grid-area:1/1] ${
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <span className="text-sm font-bold">{event.bannerText}</span>{" "}
            <span className="block sm:inline text-xs sm:text-sm font-semibold">
              {event.when}
              {event.location ? ` · ${event.location}` : ""}
              {event.audience ? ` · ${event.audience}` : ""} <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
      {count > 1 && (
        <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {events.map((event, i) => (
            <button
              key={event.id}
              type="button"
              aria-label={`Show ${event.title}`}
              aria-current={i === active}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-1.5 rounded-full bg-navy transition-opacity ${i === active ? "opacity-80" : "opacity-25 hover:opacity-50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
