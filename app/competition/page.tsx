const formatPillars = [
    {
        icon: "📈",
        title: "Live Trading Rounds",
        body: "Multi-round market-making & prop-trading simulations against peer teams",
        bg: "var(--lime-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "🎓",
        title: "Undergrad-Only",
        body: "Open exclusively to undergraduate teams from any accredited university",
        bg: "var(--sky-gradient)",
        color: "var(--navy)",
    },
    {
        icon: "🗽",
        title: "Hosted at Columbia",
        body: "100–120 students on campus in New York City for the weekend",
        bg: "var(--navy-gradient)",
        color: "#fff",
    },
];

const schedule: { date: string; title: string; milestone?: boolean }[] = [
    { date: "TBD — Fall 2026", title: "Applications open" },
    { date: "TBD — Fall 2026", title: "Applications close" },
    { date: "TBD — Fall 2026", title: "Team acceptances sent", milestone: true },
    { date: "Saturday–Sunday, December 5–6, 2026", title: "CUTC held at Columbia University", milestone: true },
    { date: "Sunday, December 6, 2026", title: "Awards & closing reception" },
];

const eligibility = [
    "Open to undergraduate students at any accredited college or university",
    "Teams of 2–4 students; solo applicants can be matched with a team",
    "No prior trading competition experience required",
    "A limited number of teams per school to keep the room balanced",
];

const faqs: { q: string; a: string }[] = [
    {
        q: "Is there a cost to attend?",
        a: "We're finalizing pricing now. Our goal is to keep the entry fee low, and travel stipends may be available for teams coming from outside the NYC area — details TBD.",
    },
    {
        q: "What does the competition actually involve?",
        a: "Teams compete across live, moderated trading rounds — think market-making and prop-trading simulations — run by CQG members and industry volunteers. No coding required.",
    },
    {
        q: "Do we need our own laptops?",
        a: "Yes, each team member should bring a laptop. Any competition-specific software will be shared ahead of time.",
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
                    <span className="tag tag-lime mb-4 inline-block">Flagship &middot; Fall 2026</span>
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
                        flagship event &mdash; an undergraduate-only trading competition that brings teams
                        from universities across the country to Columbia for a weekend of live trading
                        games, built and run by CQG members alongside industry volunteers.
                    </p>

                    <div className="hex-row mt-11">
                        {formatPillars.map((p) => (
                            <div key={p.title} className="hex-chip" style={{ background: p.bg }}>
                                <div className="hex-icon">{p.icon}</div>
                                <h3 style={{ color: p.color }}>{p.title}</h3>
                                <p style={{ color: p.color, opacity: 0.85 }}>{p.body}</p>
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
                        Exact application dates are still being finalized &mdash; check back or reach out to
                        be notified when they open.
                    </p>

                    <div className="timeline mt-10">
                        {schedule.map((step, i) => (
                            <div key={step.title} className={`timeline-step ${step.milestone ? "milestone" : ""}`}>
                                <div className="timeline-marker">{i + 1}</div>
                                <div className="font-mono text-[0.7rem] tracking-[0.07em] uppercase text-sky-deep font-semibold">
                                    {step.date}
                                </div>
                                <div className="font-display font-bold text-[1.02rem] text-navy mt-1">{step.title}</div>
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
                                    Applications haven&apos;t opened yet. Email us to be notified the moment they
                                    go live, or with any questions about eligibility.
                                </p>
                            </div>
                            <a
                                href="mailto:columbia.quant.group@gmail.com?subject=CUTC%20Application%20Interest"
                                className="btn-cqg btn-lime"
                            >
                                Notify Me When Applications Open →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prizes & sponsors */}
            <section className="py-16 sm:py-24 bg-paper">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="chevron chevron-navy">Prizes</div>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-4">
                        Prize amounts are being finalized alongside our sponsors &mdash; check back closer to
                        the event for the full breakdown.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-9">
                        {[
                            { place: "1st Place", detail: "Prize amount TBD" },
                            { place: "2nd Place", detail: "Prize amount TBD" },
                            { place: "3rd Place", detail: "Prize amount TBD" },
                        ].map((p) => (
                            <div key={p.place} className="angle-card">
                                <div className="angle-card-body text-center">
                                    <div className="stat-num text-[2rem]">{p.place}</div>
                                    <div className="text-ink-faint font-mono text-[0.8rem] mt-2">{p.detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="angle-card mt-14">
                        <div className="angle-card-body flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div>
                                <h3 className="font-display font-bold text-[1.2rem] text-navy">
                                    Sponsoring CUTC?
                                </h3>
                                <p className="text-ink-soft leading-relaxed mt-2.5 max-w-lg">
                                    CUTC sponsors get direct access to a room of 100+ vetted, competition-tested
                                    undergraduate traders from across the country. Reach out for our sponsorship
                                    package.
                                </p>
                            </div>
                            <a
                                href="mailto:columbia.quant.group@gmail.com?subject=CUTC%20Sponsorship%20Inquiry"
                                className="btn-cqg btn-lime btn-sm flex-none"
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
