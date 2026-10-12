"use client";

import { useState } from "react";
import { fullTimeBoxes } from "@/lib/data/careers";
import { treemap } from "@/lib/treemap";

const { boxes, peopleCount, companyCount } = fullTimeBoxes();
const items = boxes.map((box) => ({ ...box }));

// Two layouts so cells stay readable: wide for tablets and up, tall for phones.
const LAYOUTS = {
    wide: { w: 600, h: 400, cells: treemap(items, 600, 400), show: "hidden sm:block" },
    tall: { w: 400, h: 520, cells: treemap(items, 400, 520), show: "sm:hidden" },
};

// One blue scale: the more people in a box, the darker it is.
const counts = boxes.map((b) => b.value);
const [lo, hi] = [Math.min(...counts), Math.max(...counts)];
function shade(count: number, industry: boolean) {
    const t = hi === lo ? 1 : (count - lo) / (hi - lo);
    const dark = t > 0.4;
    // Industry labels are pink: light pink on the dark boxes, a deep pink on the light ones so it stays readable.
    const color = industry ? (t >= 0.7 ? "#FF8FC0" : "#6B0C33") : dark ? "#fff" : "#0B2F62";
    return { background: `color-mix(in srgb, #0B2F62 ${Math.round(t * 100)}%, #8DD6FF)`, color };
}

// Longest single word in a label. The label shrinks until that word fits the box, so a
// word like "Susquehanna" is never split across two lines.
const longestWord = (label: string) => Math.max(...label.split(/\s+/).map((w) => w.length));

const plural = (n: number) => (n === 1 ? "person" : "people");

export default function CareerTreemap() {
    const [active, setActive] = useState<string | null>(null);
    const selected = boxes.find((b) => b.key === active);

    return (
        <div className="bg-white border border-line p-4 sm:p-5 h-full flex flex-col" onMouseLeave={() => setActive(null)}>
            <h3 className="font-display font-bold text-lg text-navy">First role after graduating</h3>
            <p className="text-ink-soft text-sm mt-1">
                {peopleCount} people across {companyCount} companies and PhD programs. Box size and shade show how many started
                there. Pink labels are industries that group smaller companies.
            </p>

            {Object.entries(LAYOUTS).map(([key, layout]) => (
                <div
                    key={key}
                    className={`relative mt-4 w-full ${layout.show}`}
                    style={{ aspectRatio: `${layout.w} / ${layout.h}` }}
                >
                    {layout.cells.map((cell) => (
                        <button
                            key={cell.key}
                            type="button"
                            aria-label={`${cell.label}: ${cell.value} ${plural(cell.value)}`}
                            aria-pressed={active === cell.key}
                            onMouseEnter={() => setActive(cell.key)}
                            onFocus={() => setActive(cell.key)}
                            onClick={() => setActive((a) => (a === cell.key ? null : cell.key))}
                            className={`absolute p-[1px] text-left transition-opacity ${
                                active && active !== cell.key ? "opacity-40" : ""
                            }`}
                            style={{
                                left: `${(cell.x / layout.w) * 100}%`,
                                top: `${(cell.y / layout.h) * 100}%`,
                                width: `${(cell.w / layout.w) * 100}%`,
                                height: `${(cell.h / layout.h) * 100}%`,
                            }}
                        >
                            <span
                                className="block w-full h-full overflow-hidden p-1.5"
                                style={{
                                    containerType: "inline-size",
                                    ...shade(cell.value, cell.kind === "industry"),
                                }}
                            >
                                <span
                                    className="block font-semibold leading-tight"
                                    style={{ fontSize: `min(11px, calc((100cqw - 2px) / ${longestWord(cell.label) * 0.62}))` }}
                                >
                                    {cell.label}
                                </span>
                                <span className="block font-mono text-[11px] opacity-80">{cell.value}</span>
                            </span>
                        </button>
                    ))}
                </div>
            ))}

            <div className="mt-4 min-h-[4.5rem] text-sm" aria-live="polite">
                {selected ? (
                    <>
                        <div className="font-semibold text-navy">
                            {selected.label} &middot; {selected.value} {plural(selected.value)}
                        </div>
                        <div className="text-ink-soft mt-0.5">
                            {selected.kind === "company"
                                ? selected.people.map((p) => p.name).join(", ")
                                : selected.people.map((p) => `${p.name} (${p.company})`).join(", ")}
                        </div>
                    </>
                ) : (
                    <div className="text-ink-faint">Hover or tap a box to see who.</div>
                )}
            </div>
        </div>
    );
}
