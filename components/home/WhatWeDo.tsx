const pillars = [
  {
    icon: "💡",
    title: "Education",
    body: "Weekly sessions on probability & trading strategy",
    bg: "var(--lime-gradient)",
    color: "var(--navy)",
  },
  {
    icon: "🎯",
    title: "Firm Engagement",
    body: "Trading games, data challenges & office treks",
    bg: "var(--sky-gradient)",
    color: "var(--navy)",
  },
  {
    icon: "⚽",
    title: "Campus Events",
    body: "Poker Tournament, Math Tournament & CUTC",
    bg: "var(--navy-gradient)",
    color: "#fff",
  },
];

export default function WhatWeDo() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="chevron chevron-navy">What We Do</div>
        <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-4">
          We&apos;re the only student organization at Columbia dedicated to quantitative finance &mdash;
          serving both undergraduate and graduate students. We identify, develop, and connect
          Columbia&apos;s top quantitative talent, giving students early exposure to the industry,
          rigorous technical preparation, and direct access to professionals at leading firms.
        </p>

        <div className="hex-row mt-11">
          {pillars.map((p) => (
            <div key={p.title} className="hex-chip" style={{ background: p.bg }}>
              <div className="hex-icon">{p.icon}</div>
              <h3 style={{ color: p.color }}>{p.title}</h3>
              <p style={{ color: p.color, opacity: 0.85 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
