"use client";

import { useState } from "react";
import Image from "next/image";
import FirstYearMark from "./FirstYearMark";
import CareerLines from "./CareerLines";
import { careerOf } from "@/lib/data/careers";
import { sortByExecRole } from "@/lib/exec-order";
import { execBoard2026, type Exec } from "@/lib/data/exec-board-2026";

function ExecCard({ exec, firstYear }: { exec: Exec; firstYear: boolean }) {
    const [flipped, setFlipped] = useState(false);
    const rows: [string, string][] = [
        ["Major", exec.major],
        ["Interests", exec.interests],
        ["Summer 2026", exec.summer],
        ["Previous", exec.previous],
    ];

    return (
        <div
            className={`exec-card ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFlipped((f) => !f);
                }
            }}
        >
            <div className="exec-card-inner">
                <div className="exec-face front">
                    <div className="exec-photo relative">
                        <Image
                            src={exec.image}
                            alt={exec.name}
                            fill
                            unoptimized
                            className="object-cover"
                            style={{
                                objectPosition: exec.photoPosition,
                                transform: exec.photoScale !== 1 ? `scale(${exec.photoScale})` : undefined,
                            }}
                        />
                    </div>
                    <div className="exec-info">
                        <div className="name">
                            {exec.name}
                            {firstYear && <FirstYearMark />}
                        </div>
                        <div className="role">{exec.role}</div>
                        <CareerLines career={careerOf(exec.name)} />
                    </div>
                </div>
                <div className="exec-face back">
                    <div className="name">
                            {exec.name}
                            {firstYear && <FirstYearMark />}
                        </div>
                    <div className="role">{exec.role}</div>
                    <div className="bio-list">
                        {rows.map(([label, value]) => (
                            <div key={label} className="bio-row">
                                <span className="bk">{label}</span>
                                <span className="bv">{value}</span>
                            </div>
                        ))}
                    </div>
                    <a
                        className="li-link"
                        href={exec.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View LinkedIn ↗
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function ExecBoard({ firstYearNames = [] }: { firstYearNames?: string[] }) {
    return (
        <section className="bg-paper-alt py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2026 Executive Board</h2>
                <div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                >
                    {sortByExecRole(execBoard2026, (e) => e.role).map((exec) => (
                        <ExecCard key={exec.name} exec={exec} firstYear={firstYearNames.includes(exec.name)} />
                    ))}
                </div>
            </div>
        </section>
    );
}
