import Link from "next/link";

const cohostedEvents = [
    {
        icon: "♠",
        name: "Poker Tournament",
        partner: "Columbia Poker Club",
        body: "Co-hosted with Columbia Poker Club. Eligibility, rules, and sign-up are managed by the club.",
        href: "https://www.columbiapoker.club/",
        linkLabel: "columbiapoker.club",
    },
    {
        icon: "∑",
        name: "Intercollegiate Math Tournament",
        partner: "IMT Organizers",
        body: "Co-hosted and sponsored by CQG. Eligibility and applications are managed by the tournament organizers.",
        href: "https://intercollegiatemathtournament.org/",
        linkLabel: "intercollegiatemathtournament.org",
    },
];

export default function EventsPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-sky mb-2 block w-fit">General Body &middot; Open to All</span>
                    <div className="chevron chevron-sky mb-4">Events</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        Firm info sessions, Q&amp;As, and trading challenges hosted with our sponsor firms
                        &mdash; open to Columbia&apos;s undergraduate and graduate community. Join the
                        General Body to be added to our email list and be notified when events are
                        announced. Seats are limited for each event and filled first come, first serve.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="eyebrow text-navy mb-4">Upcoming</div>
                    <div className="event-card max-w-[640px]" style={{ "--card-border": "var(--sky)" } as React.CSSProperties}>
                        <div className="event-card-body">
                            <div className="event-icon" style={{ background: "var(--sky-gradient)", color: "var(--navy)" }}>
                                📬
                            </div>
                            <h3 className="font-display font-bold text-[1.35rem] text-navy">
                                Not on our list yet? Join the General Body.
                            </h3>
                            <p className="text-ink-soft">
                                General body members get emails the moment firm info sessions, Q&amp;As, and
                                trading challenges are announced &mdash; open to undergrads and grad students
                                alike.
                            </p>
                            <a href="/portal/signup" className="btn-cqg btn-lime self-start">
                                Sign Up &rarr;
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 bg-paper">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="chevron chevron-navy mb-2.5">CQG Co-Hosts</div>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-2">
                        CQG helps organize and sponsor these events, but eligibility, applications, and rules
                        are set by our partners &mdash; visit their site for details.
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2 mt-9">
                        {cohostedEvents.map((event) => (
                            <div
                                key={event.name}
                                className="event-card"
                                style={{ "--card-border": "var(--line)" } as React.CSSProperties}
                            >
                                <div className="event-card-body">
                                    <div className="flex justify-between items-start">
                                        <div className="event-icon">{event.icon}</div>
                                        <span className="tag tag-outline">Co-hosted</span>
                                    </div>
                                    <h3 className="font-display font-bold text-[1.2rem] text-navy">
                                        {event.name}
                                    </h3>
                                    <p className="text-ink-soft text-[0.95rem]">{event.body}</p>
                                    <a
                                        href={event.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-sky-deep text-sm"
                                    >
                                        See eligibility &amp; apply &rarr; {event.linkLabel}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="angle-card angle-card-navy max-w-[640px]">
                        <div className="angle-card-body flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div>
                                <h3 className="font-display font-bold text-[1.1rem]">
                                    Looking for CUTC?
                                </h3>
                                <p className="text-[#C3D2EA] mt-2 text-sm max-w-sm">
                                    The Columbia University Trading Competition is CQG&apos;s own flagship
                                    event, open to undergrads at any US university.
                                </p>
                            </div>
                            <Link href="/competition" className="btn-cqg btn-pink btn-sm flex-none">
                                View CUTC &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
