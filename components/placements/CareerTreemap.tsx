"use client";

import { useState } from "react";
import { fullTimeByCompany } from "@/lib/data/careers";
import { treemap } from "@/lib/treemap";

const { groups, phdCount } = fullTimeByCompany();
const items = groups.map((g) => ({ ...g, value: g.people.length }));

// Two layouts so cells stay readable: wide for tablets and up, tall for phones.
const LAYOUTS = {
    wide: { w: 600, h: 400, cells: treemap(items, 600, 400), show: "hidden sm:block" },
    tall: { w: 400, h: 520, cells: treemap(items, 400, 520), show: "sm:hidden" },
};

// Bigger groups are darker.
function tone(count: number) {
    if (count >= 5) return "bg-navy text-white";
    if (count >= 3) return "bg-[#1D4A87] text-white";
    if (count >= 2) return "bg-sky-deep text-white";
    return "bg-sky text-navy";
}

export default function CareerTreemap() {
    const [active, setActive] = useState<string | null>(null);
    const selected = groups.find((g) => g.company === active);

    return (
        <div className="bg-white border border-line p-4 sm:p-5 h-full flex flex-col" onMouseLeave={() => setActive(null)}>
            <h3 className="font-display font-bold text-lg text-navy">First role after graduating</h3>
            <p className="text-ink-soft text-sm mt-1">
                {groups.length} companies. Box size shows how many members started there.
            </p>

            {Object.entries(LAYOUTS).map(([key, layout]) => (
                <div
                    key={key}
                    className={`relative mt-4 w-full ${layout.show}`}
                    style={{ aspectRatio: `${layout.w} / ${layout.h}` }}
                >
                    {layout.cells.map((cell) => (
                        <button
                            key={cell.company}
                            type="button"
                            aria-label={`${cell.company}: ${cell.value} ${cell.value === 1 ? "person" : "people"}`}
                            aria-pressed={active === cell.company}
                            onMouseEnter={() => setActive(cell.company)}
                            onFocus={() => setActive(cell.company)}
                            onClick={() => setActive((a) => (a === cell.company ? null : cell.company))}
                            className={`absolute p-[1px] text-left transition-opacity ${
                                active && active !== cell.company ? "opacity-40" : ""
                            }`}
                            style={{
                                left: `${(cell.x / layout.w) * 100}%`,
                                top: `${(cell.y / layout.h) * 100}%`,
                                width: `${(cell.w / layout.w) * 100}%`,
                                height: `${(cell.h / layout.h) * 100}%`,
                            }}
                        >
                            <span className={`block w-full h-full overflow-hidden p-1.5 ${tone(cell.value)}`}>
                                <span className="block font-semibold text-[11px] leading-tight break-words">
                                    {cell.company}
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
                            {selected.company} &middot; {selected.people.length}{" "}
                            {selected.people.length === 1 ? "person" : "people"}
                        </div>
                        <div className="text-ink-soft mt-0.5">{selected.people.join(", ")}</div>
                    </>
                ) : (
                    <div className="text-ink-faint">Hover or tap a box to see who.</div>
                )}
            </div>
            {phdCount > 0 && (
                <p className="text-ink-faint text-xs">{phdCount} more started a PhD instead (not shown).</p>
            )}
        </div>
    );
}
