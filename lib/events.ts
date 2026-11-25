// Pure helpers for events (safe to import from client components): Eastern-time handling,
// date formatting, and who is eligible to RSVP.

import type { CqgSchool, EventEligibility, PromoColor } from "@/lib/supabase/types";

const TZ = "America/New_York";

// Minutes that Eastern time is offset from UTC at the given instant (-300 in winter, -240 in summer).
function easternOffsetMinutes(utcMs: number): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(new Date(utcMs));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return (asUtc - Math.floor(utcMs / 1000) * 1000) / 60000;
}

/** "2026-12-05T14:30" typed in the admin form (Eastern time) to a UTC ISO string. */
export function easternLocalToIso(local: string): string | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
    if (!m) return null;
    const naive = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
    let utc = naive - easternOffsetMinutes(naive) * 60000;
    utc = naive - easternOffsetMinutes(utc) * 60000;
    return new Date(utc).toISOString();
}

/** A UTC ISO string to the "2026-12-05T14:30" form a datetime-local input expects, in Eastern time. */
export function isoToEasternLocal(iso: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "Dec 5, 2026, 2:30 PM ET" */
export const formatEventTime = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }) + " ET";

function clock(d: Date): { text: string; meridiem: string } {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const meridiem = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
    return { text: minute === "00" ? hour : `${hour}:${minute}`, meridiem };
}

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

/** "Dec 5, 2:30–4 PM ET" (or just the start time when there's no end, or it ends on another day). */
export function formatEventWhen(startsAt: string, endsAt: string | null): string {
    const start = new Date(startsAt);
    const date = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(start);
    const s = clock(start);
    if (!endsAt) return `${date}, ${s.text} ${s.meridiem} ET`;
    const end = new Date(endsAt);
    if (dayKey(start) !== dayKey(end)) return `${date}, ${s.text} ${s.meridiem} ET`;
    const e = clock(end);
    const range = s.meridiem === e.meridiem ? `${s.text}–${e.text} ${e.meridiem}` : `${s.text} ${s.meridiem}–${e.text} ${e.meridiem}`;
    return `${date}, ${range} ET`;
}

/** When an event stops being promoted: its end time, or 3 hours after it starts if it has none. */
export function promotionEndsAt(startsAt: string, endsAt: string | null): Date {
    return endsAt ? new Date(endsAt) : new Date(new Date(startsAt).getTime() + 3 * 60 * 60 * 1000);
}

const UNDERGRAD_SCHOOLS: CqgSchool[] = ["CC", "SEAS", "Barnard", "GS"];

/** Mirrors the check in the cqg_event_apply database function (admins are never blocked). */
export function eligibilityProblem(eligibility: EventEligibility, school: CqgSchool | null, isAdmin = false): string | null {
    if (isAdmin || eligibility === "all") return null;
    if (eligibility === "undergraduate") {
        return school && UNDERGRAD_SCHOOLS.includes(school) ? null : "This event is open to undergraduate students only.";
    }
    return school === "GRAD" ? null : "This event is open to graduate students only.";
}

export const ELIGIBILITY_LABEL: Record<EventEligibility, string> = {
    all: "Undergraduate & graduate students",
    undergraduate: "Undergraduates only",
    graduate: "Graduate students only",
};

// Full class names so Tailwind picks them up.
export const COLOR_STYLES: Record<PromoColor, { bg: string; btn: string; tag: string; gradient: string; border: string }> = {
    pink: { bg: "bg-pink", btn: "btn-pink", tag: "tag-pink", gradient: "var(--pink-gradient)", border: "var(--pink)" },
    lime: { bg: "bg-lime", btn: "btn-lime", tag: "tag-lime", gradient: "var(--lime-gradient)", border: "var(--lime)" },
    sky: { bg: "bg-sky", btn: "btn-sky", tag: "tag-sky", gradient: "var(--sky-gradient)", border: "var(--sky)" },
};
