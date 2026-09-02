import MemoryMatch from "@/components/education/MemoryMatch";

const pillars = [
    {
        icon: "📚",
        title: "Lecture Series",
        body: "Weekly sessions on probability & trading strategy",
        bg: "var(--lime-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "🤝",
        title: "Mentorship",
        body: "Paired with upperclassmen in trading & research",
        bg: "var(--sky-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "⚽",
        title: "Market Games",
        body: "Monthly market-making & trading simulations",
        bg: "var(--navy-gradient)",
        color: "#fff",
    },
];

export default function EducationPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="chevron chevron-sky mb-4">Education</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        A student-run curriculum that gives internal members early exposure to the skills
                        used in real quantitative roles.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="hex-row">
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

            <section className="bg-paper-alt py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="eyebrow text-navy mb-3">A Little Fun</div>
                    <h2 className="font-display font-extrabold text-2xl text-navy">Memory Match</h2>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed mt-2.5">
                        How well do you know our exec board and 2026&ndash;2027 sponsors?
                    </p>

                    <div className="mt-7">
                        <MemoryMatch />
                    </div>
                </div>
            </section>
        </div>
    );
}
