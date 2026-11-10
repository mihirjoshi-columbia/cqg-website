import type { Metadata } from "next";
import { partners, sponsorTiers, SPONSOR_YEAR, type SponsorTier } from "@/lib/data/sponsors";

export const metadata: Metadata = {
    title: "Sponsors | Columbia Quant Group",
    description: `The firms and partners backing Columbia Quant Group for the ${SPONSOR_YEAR} academic year.`,
};

// Tier accent colors label each block; tile and logo sizes step down from gold to bronze. Rows are
// flex-wrapped and centered so a tier whose count doesn't fill its last row (7 silvers in 3 columns)
// doesn't leave an orphan tile at the left edge. Tailwind only emits classes it sees spelled out in
// source, so every class string lives here in full.
const tierStyles: Record<SponsorTier, { accent: string; tile: string; logo: string }> = {
    gold: {
        accent: "#F2C94C",
        tile: "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)] min-h-[11rem] sm:min-h-[13rem]",
        logo: "max-h-[5.5rem] max-w-[78%]",
    },
    silver: {
        accent: "#C9D6EA",
        tile: "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)] min-h-[8rem] sm:min-h-[10rem]",
        logo: "max-h-[3.25rem] max-w-[74%]",
    },
    bronze: {
        accent: "#D9A066",
        tile: "w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] min-h-[6.5rem] sm:min-h-[8rem]",
        logo: "max-h-[2.5rem] max-w-[70%]",
    },
};

export default function SponsorsPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="chevron chevron-sky mb-4">Our Sponsors</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        The firms and partners backing Columbia Quant Group for the {SPONSOR_YEAR} academic year,
                        from CTT and our trading games to speaker events and the general body.
                    </p>
                </div>
            </section>

            <section className="bg-navy-deep py-14 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-14 sm:gap-16">
                    {sponsorTiers.map(({ tier, label, sponsors }) => {
                        const styles = tierStyles[tier];
                        return (
                            <div key={tier}>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="eyebrow font-semibold" style={{ color: styles.accent }}>
                                        {label} Sponsors
                                    </span>
                                    <span className="sponsor-tier-rule" />
                                </div>
                                <div className="flex flex-wrap justify-center gap-5">
                                    {sponsors.map((s) => (
                                        <a
                                            key={s.name}
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.name}
                                            className={`sponsor-tile ${styles.tile}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element -- varying aspect ratios, CSS-driven sizing */}
                                            <img src={s.logo} alt={s.name} className={`w-auto object-contain ${styles.logo}`} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="py-14 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="chevron chevron-navy text-[1.4rem]">Partners</div>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mt-6">
                        Beyond the sponsorship tiers, these partners power CTT and keep our members fed.
                    </p>
                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                        {partners.map((p) => (
                            <a
                                key={p.name}
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="angle-card block"
                            >
                                <div className="angle-card-body flex flex-col gap-5 h-full">
                                    <div className="h-14 flex items-center">
                                        {p.logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element -- static logo, CSS-driven sizing
                                            <img src={p.logo} alt={p.name} className="max-h-12 w-auto max-w-[260px] object-contain" />
                                        ) : (
                                            <span className="font-display font-black text-navy text-[2rem] leading-none tracking-tight">
                                                {p.name}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="eyebrow eyebrow-plain text-sky-deep font-semibold">{p.role}</div>
                                        <p className="text-ink-soft text-sm leading-relaxed mt-2">{p.blurb}</p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-paper py-14 sm:py-16 text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="chevron chevron-lime mx-auto inline-flex">Interested in sponsoring?</div>
                    <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mx-auto mt-6">
                        Reach out to learn about sponsorship tiers and partnering with CQG for the year.
                    </p>
                    <div className="flex justify-center mt-7">
                        <a href="mailto:columbia.quant.group@gmail.com" className="btn-cqg btn-outline-navy">
                            Get in Touch
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
