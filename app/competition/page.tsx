const formatPillars = [
    {
        icon: "💰",
        title: "$10K Prize Pool",
        body: "",
        bg: "var(--pink-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "📈",
        title: "Live Trading Rounds",
        body: "Multi-round market-making & prop-trading simulations against fellow competitors",
        bg: "var(--pink-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "🎓",
        title: "Undergrad-Only",
        body: "Open exclusively to undergraduates from any accredited US university",
        bg: "var(--pink-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "🗽",
        title: "Hosted at Columbia",
        body: "100–120 students on campus in New York City for the weekend",
        bg: "var(--pink-gradient)",
        color: "var(--navy)",
    },
];

const schedule: { date: string; title: string; detail?: string; milestone?: boolean }[] = [
    { date: "Monday, September 7, 2026", title: "Applications open" },
    { date: "Friday, September 25, 2026", title: "Applications close" },
    { date: "Friday, October 9, 2026", title: "Acceptances sent", milestone: true },
    { date: "Friday–Saturday, December 4–5, 2026", title: "Competitors arrive" },
    {
        date: "Saturday, December 5, 2026",
        title: "CUTC Day 1",
        detail: "Includes the Quant Career Fair — open to all CUTC sponsors and CQG's general body",
        milestone: true,
    },
    { date: "Sunday, December 6, 2026", title: "CUTC Day 2 — Awards & Closing", milestone: true },
];

const eligibility = [
    "Open to undergraduates at any accredited college or university in the United States",
    "No prior trading competition experience required",
    "Primarily geared toward underclassmen — first- and second-years encouraged to apply",
];

const faqs: { q: string; a: string }[] = [
    {
        q: "Is there a cost to attend?",
        a: "Travel and lodging will be covered for competitors. We'll share exact logistics after acceptances go out.",
    },
    {
        q: "What does the competition actually involve?",
        a: "Compete across live, moderated trading rounds — think market-making and prop-trading simulations — run by CQG members and competition sponsors.",
    },
    {
        q: "Where can I ask other questions?",
        a: "Reach out any time at columbia.quant.group@gmail.com — we'll get back to you within a couple of days.",
    },
];

export default function CompetitionPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-pink mb-2 block w-fit">Flagship &middot; Fall 2026</span>
                    <div className="chevron chevron-sky mb-4">Columbia University Trading Competition</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        CQG&apos;s new intercollegiate flagship event &mdash; an undergraduate-only trading
                        competition bringing 100&ndash;120 students from universities across the US to
                        Columbia for live trading games.
                    </p>
                    <span className="font-mono text-[0.78rem] text-[#8CA0C2] mt-5 inline-block">
                        CUTC &middot; December 5&ndash;6, 2026 &middot; New York, NY
                    </span>
                </div>
            </section>

            {/* Overview & format */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="chevron chevron-navy">What Is CUTC?</div>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-4">
                        The Columbia University Trading Competition is CQG&apos;s first intercollegiate
                        flagship event &mdash; an undergraduate-only trading competition that brings
                        undergraduates from universities across the country to Columbia for a weekend of
                        live trading games, built and run by CQG members alongside competition sponsors.
                    </p>

                    <div className="pillar-row mt-11">
                        {formatPillars.map((p) => (
                            <div key={p.title} className="pillar-card" style={{ background: p.bg }}>
                                <div className="pillar-icon">{p.icon}</div>
                                <h3 style={{ color: p.color }}>{p.title}</h3>
                                {p.body && <p style={{ color: p.color, opacity: 0.85 }}>{p.body}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Schedule */}
            <section className="py-16 sm:py-24 bg-paper">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "840px" }}>
                    <div className="eyebrow text-sky-deep mb-2.5">Key Dates</div>
                    <h2 className="font-display font-extrabold text-[clamp(1.7rem,3.2vw,2.3rem)] text-navy">
                        Schedule
                    </h2>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-xl mt-3.5">
                        Mark your calendar &mdash; here&apos;s what to expect from application to
                        competition day.
                    </p>

                    <div className="timeline timeline-pink mt-10">
                        {schedule.map((step, i) => (
                            <div key={step.title} className={`timeline-step ${step.milestone ? "milestone" : ""}`}>
                                <div className="timeline-marker">{i + 1}</div>
                                <div className="font-mono text-[0.7rem] tracking-[0.07em] uppercase text-sky-deep font-semibold">
                                    {step.date}
                                </div>
                                <div className="font-display font-bold text-[1.02rem] text-navy mt-1">{step.title}</div>
                                {step.detail && (
                                    <div className="text-ink-soft text-[0.9rem] mt-1.5 max-w-md">{step.detail}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Eligibility & how to apply */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <div className="eyebrow text-navy mb-2.5">Eligibility</div>
                        <h2 className="font-display font-extrabold text-[clamp(1.5rem,2.8vw,2rem)] text-navy">
                            Who can apply
                        </h2>
                        <ul className="mt-5 space-y-3">
                            {eligibility.map((item) => (
                                <li key={item} className="flex gap-3 text-ink-soft text-[1.02rem] leading-relaxed">
                                    <span className="text-sky-deep font-bold">&mdash;</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="angle-card angle-card-navy">
                        <div className="angle-card-body flex flex-col items-start justify-between gap-6">
                            <div>
                                <h3 className="font-display font-bold text-[1.15rem]">Ready to compete?</h3>
                                <p className="text-[#C3D2EA] mt-2.5 text-sm">
                                    Applications are open now through September 25. Create a CUTC account to
                                    apply &mdash; Columbia and Barnard students apply from their CQG portal
                                    account instead.
                                </p>
                            </div>
                            <a href="/cutc/apply/signup" className="btn-cqg btn-pink">
                                Apply Now →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sponsors */}
            <section className="py-16 sm:py-24 bg-paper">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="angle-card max-w-3xl">
                        <div className="angle-card-body flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div>
                                <h3 className="font-display font-bold text-[1.2rem] text-navy">
                                    Interested in Sponsoring CUTC?
                                </h3>
                                <p className="text-ink-soft leading-relaxed mt-2.5 max-w-lg">
                                    CUTC sponsors get direct access to a room of 100+ vetted, competition-tested
                                    undergraduate traders from across the country. Reach out for our sponsorship
                                    package.
                                </p>
                            </div>
                            <a
                                href="mailto:columbia.quant.group@gmail.com?subject=CUTC%20Sponsorship%20Inquiry"
                                className="btn-cqg btn-pink btn-sm flex-none"
                            >
                                Request Sponsorship Deck
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "780px" }}>
                    <div className="eyebrow text-navy mb-2.5">FAQ</div>
                    <h2 className="font-display font-extrabold text-[clamp(1.7rem,3.2vw,2.3rem)] text-navy">
                        Common questions
                    </h2>

                    <div className="mt-10 divide-y divide-line">
                        {faqs.map((item) => (
                            <div key={item.q} className="py-6 first:pt-0">
                                <h3 className="font-display font-bold text-[1.05rem] text-navy">{item.q}</h3>
                                <p className="text-ink-soft leading-relaxed mt-2.5">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
