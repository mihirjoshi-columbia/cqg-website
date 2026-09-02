import Link from "next/link";

const pillars = [
  {
    icon: "🎓",
    title: "Internal Membership",
    body: "Selective, undergrad-only. Lectures & market-making games",
    bg: "var(--lime-gradient)",
    color: "var(--navy)",
    href: "/recruitment",
  },
  {
    icon: "🤝",
    title: "General Body",
    body: "Open to all. Firm info sessions, Q&As & trading challenges",
    bg: "var(--sky-gradient)",
    color: "var(--navy)",
    href: "/events",
  },
  {
    icon: "🏆",
    title: "CUTC",
    body: "Our flagship competition, open to undergrads nationwide",
    bg: "var(--pink-gradient)",
    color: "var(--navy)",
    href: "/competition",
  },
];

export default function WhatWeDo() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="chevron chevron-navy">What We Do</div>
        <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-4">
          Columbia Quant Group runs three distinct programs: a selective internal membership for
          undergraduates who complete our technical screening, an open general body for the wider Columbia
          community, and CUTC &mdash; the intercollegiate trading competition we exclusively host each
          fall.
        </p>

        <div className="pillar-row mt-11">
          {pillars.map((p) => (
            <Link key={p.title} href={p.href} className="pillar-card" style={{ background: p.bg }}>
              <div className="pillar-icon">{p.icon}</div>
              <h3 style={{ color: p.color }}>{p.title}</h3>
              <p style={{ color: p.color, opacity: 0.85 }}>{p.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
