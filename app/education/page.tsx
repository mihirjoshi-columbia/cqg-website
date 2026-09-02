import MemoryMatch from "@/components/education/MemoryMatch";

const pillars = [
    {
        icon: "📚",
        title: "Lecture Series",
        body: "Student-run weekly sessions on probability & trading strategy",
    },
    {
        icon: "🤝",
        title: "Mentorship",
        body: "Pair new members with senior members based on focus area (trading, research, dev)",
    },
    {
        icon: "⚽",
        title: "Market Games",
        body: "Student-run market-making simulations",
    },
];

export default function EducationPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-lime mb-2 block w-fit">Internal Membership &middot; Program</span>
                    <div className="chevron chevron-sky mb-4">Education</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        A student-run curriculum open exclusively to CQG&apos;s internal members &mdash;
                        early, hands-on exposure to the skills used in real quantitative roles.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="pillar-row">
                        {pillars.map((p) => (
                            <div key={p.title} className="event-card" style={{ alignSelf: "stretch" }}>
                                <div
                                    className="event-card-body items-center text-center h-full"
                                    style={{ background: "linear-gradient(135deg, #D3D9E4 0%, #B8C0D1 55%, #9AA5BA 100%)" }}
                                >
                                    <div
                                        className="flex items-center justify-center rounded-full"
                                        style={{ width: 56, height: 56, background: "var(--lime-gradient)", fontSize: "1.5rem" }}
                                    >
                                        {p.icon}
                                    </div>
                                    <h3 className="font-display font-bold text-[1.1rem] text-navy">{p.title}</h3>
                                    <p className="text-ink-soft text-[0.95rem] leading-relaxed">{p.body}</p>
                                </div>
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
