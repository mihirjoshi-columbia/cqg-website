export default function EventsPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="chevron chevron-sky mb-4">Events</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        Trading &amp; math competitions, speaker panels, trading games, and information
                        sessions.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="eyebrow text-navy mb-4">Upcoming</div>
                    <div className="event-card max-w-[640px]" style={{ borderColor: "var(--lime)" }}>
                        <div className="flex justify-between items-start">
                            <div className="event-icon" style={{ background: "var(--lime-gradient)", color: "var(--navy)" }}>
                                🏆
                            </div>
                            <span className="tag tag-lime">Flagship &middot; Fall 2026</span>
                        </div>
                        <h3 className="font-display font-bold text-[1.35rem] text-navy">
                            Columbia University Trading Competition (CUTC)
                        </h3>
                        <p className="text-ink-soft">
                            CQG&apos;s new intercollegiate flagship event &mdash; an undergraduate-only
                            trading competition bringing 100&ndash;120 students from universities across
                            the US to Columbia for live trading games.
                        </p>
                        <span className="font-mono text-[0.78rem] text-ink-faint">
                            CUTC &middot; December 5&ndash;6, 2026 &middot; New York, NY
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}
