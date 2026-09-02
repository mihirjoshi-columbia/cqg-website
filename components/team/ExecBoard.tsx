"use client";

import { useState } from "react";
import Image from "next/image";

interface Exec {
    name: string;
    role: string;
    image: string;
    linkedin: string;
    major: string;
    interests: string;
    summer: string;
    previous: string;
    /** Manual per-photo tuning so heads read at a roughly consistent size/position — source photos vary a lot in framing. */
    photoPosition: string;
    photoScale: number;
}

const execBoard: Exec[] = [
    {
        name: "Aurora Wang",
        role: "President",
        image: "/team/aurora.jpeg",
        linkedin: "https://www.linkedin.com/in/aurorawang15/",
        major: "Computer Science (SEAS)",
        interests: "Quant modeling, fixed income, econ policy, NLP",
        summer: "IMC — Quant Trading Intern",
        previous: "Weiss Asset Management",
        photoPosition: "50% 18%",
        photoScale: 1,
    },
    {
        name: "Nicole Pi",
        role: "External VP",
        image: "/team/nicole.jpg",
        linkedin: "https://www.linkedin.com/in/nicoleipi/",
        major: "Computer Science (SEAS)",
        interests: "Statistical modeling & ML, responsible AI",
        summer: "DRW — Quant Trading Intern",
        previous: "SpaceX, Goldman Sachs",
        photoPosition: "48% 4%",
        photoScale: 1.15,
    },
    {
        name: "Victor Robila",
        role: "Internal VP",
        image: "/team/victor.jpeg",
        linkedin: "https://www.linkedin.com/in/victor-robila/",
        major: "Computer Science & Mathematics",
        interests: "Systematic strategies, mispricing",
        summer: "Bridgewater — Investment Engineer Intern",
        previous: "Gilder Gagnon Howe, private equity",
        photoPosition: "48% 14%",
        photoScale: 1.05,
    },
    {
        name: "Mihir Joshi",
        role: "Co-Head of Education",
        image: "/team/mihir.jpeg",
        linkedin: "https://www.linkedin.com/in/mihirjoshi-columbia/",
        major: "Computer Science (SEAS)",
        interests: "Low-latency systems, computer architecture",
        summer: "Chicago Trading Company — Quant Trading Intern",
        previous: "CFO, Lion Fund LLC",
        photoPosition: "50% 8%",
        photoScale: 1,
    },
    {
        name: "Nikhil Mudumbi",
        role: "Co-Head of Education",
        image: "/team/nikhil.jpeg",
        linkedin: "https://www.linkedin.com/in/nikhil-mudumbi-614b17247/",
        major: "Mathematics",
        interests: "Analysis & probability, stochastics",
        summer: "Math research at Columbia",
        previous: "Jane Street — Trading Intern",
        photoPosition: "50% 10%",
        photoScale: 1.05,
    },
    {
        name: "Ivy Hu",
        role: "Marketing & Communications Chair",
        image: "/team/ivy.jpg",
        linkedin: "https://www.linkedin.com/in/ivy-hu-ab8577342/",
        major: "Physics & Computer Science",
        interests: "Quantitative modeling, quantum computing",
        summer: "NASA — ML Researcher (LISA project)",
        previous: "Plasma & astrophysics research",
        photoPosition: "50% 6%",
        photoScale: 1,
    },
];

function ExecCard({ exec }: { exec: Exec }) {
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
                        <div className="name">{exec.name}</div>
                        <div className="role">{exec.role}</div>
                    </div>
                </div>
                <div className="exec-face back">
                    <div className="name">{exec.name}</div>
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

export default function ExecBoard() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2026 Executive Board</h2>
                <div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                >
                    {execBoard.map((exec) => (
                        <ExecCard key={exec.name} exec={exec} />
                    ))}
                </div>
            </div>
        </section>
    );
}
