import Link from "next/link";

const recruitmentSteps: { date: string; title: string; milestone?: boolean }[] = [
    { date: "Friday, Sept 4", title: "Recruitment information posted" },
    { date: "Friday, Sept 11", title: "Applications open" },
    { date: "Saturday, Sept 19", title: "Applications close" },
    { date: "Saturday, Sept 19 (evening)", title: "First-round interview invitations sent" },
    { date: "Monday–Wednesday, Sept 21–23", title: "First-round interviews held" },
    { date: "Thursday, Sept 24", title: "Final-round interview invitations sent" },
    { date: "Saturday–Sunday, Sept 26–27", title: "Final-round interviews held" },
    { date: "Week of Sept 21–27", title: "Acceptances sent", milestone: true },
    { date: "Week of Oct 5–9", title: "First general meeting", milestone: true },
];

export default function RecruitmentPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-lime mb-2 block w-fit">Internal Membership &middot; Apply</span>
                    <div className="chevron chevron-sky mb-4">Recruitment</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        We recruit internal members once a year, every fall &mdash; but the general body
                        is open all year round.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "840px" }}>
                    <div className="eyebrow text-sky-deep mb-2.5">Fall 2026 Internal Recruitment</div>
                    <h2 className="font-display font-extrabold text-[clamp(1.7rem,3.2vw,2.3rem)] text-navy">
                        How &amp; when we&apos;re recruiting
                    </h2>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-xl mt-3.5">
                        Internal membership is limited to a selective, technically-vetted cohort of
                        Columbia undergraduates.
                    </p>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-xl mt-3">
                        Members receive exclusive access to our education program &mdash;{" "}
                        <Link href="/education" className="text-sky-deep font-semibold">
                            see what it includes &rarr;
                        </Link>
                    </p>

                    <div className="timeline mt-10">
                        {recruitmentSteps.map((step, i) => (
                            <div key={step.title} className={`timeline-step ${step.milestone ? "milestone" : ""}`}>
                                <div className="timeline-marker">{i + 1}</div>
                                <div className="font-mono text-[0.7rem] tracking-[0.07em] uppercase text-sky-deep font-semibold">
                                    {step.date}
                                </div>
                                <div className="font-display font-bold text-[1.02rem] text-navy mt-1">{step.title}</div>
                            </div>
                        ))}
                    </div>

                    <div className="angle-card angle-card-navy mt-10" style={{ maxWidth: "560px" }}>
                        <div className="angle-card-body flex flex-col items-start gap-8">
                            <div>
                                <h3 className="font-display font-bold text-[1.15rem]">
                                    Not ready to interview? Join the general body.
                                </h3>
                                <p className="text-[#C3D2EA] mt-2.5 text-sm">
                                    All general body members receive emails about firm info sessions,
                                    firm-run trading challenges, and Q&amp;As with firms and startups
                                    &mdash; open to undergrads and grad students alike.
                                </p>
                            </div>
                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSf40xbUhMYx8ELABAJccR5BftONiy-W5QZohLuGVV2pQAxf5A/viewform?usp=dialog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-cqg btn-lime"
                            >
                                Sign Up →
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
