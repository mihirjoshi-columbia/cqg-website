import type { ReactNode } from "react";

// Logos in /logos/collage are transparent and trimmed to the artwork. The grid alternates like a
// checkerboard (4 columns, in this order): tiles with a `bg` color hold a white logo (AQR keeps its cyan),
// the others hold a colored logo on white. Changing the order or column count changes the pattern.
const firms: { name: string; logo: string; url: string; bg?: string }[] = [
    { name: "AQR", bg: "#02153D", logo: "/logos/collage/aqr.png?v=3", url: "https://www.aqr.com" },
    { name: "BlackRock", logo: "/logos/collage/blackrock.png?v=3", url: "https://www.blackrock.com" },
    { name: "Bloomberg", bg: "#000000", logo: "/logos/collage/bloomberg.png?v=3", url: "https://www.bloomberg.com" },
    { name: "Bridgewater", logo: "/logos/collage/bridgewater.png?v=3", url: "https://www.bridgewater.com" },
    { name: "Citadel", logo: "/logos/collage/citadel.png?v=3", url: "https://www.citadel.com" },
    { name: "Citadel Securities", bg: "#171628", logo: "/logos/collage/citadel-securities.png?v=3", url: "https://www.citadelsecurities.com" },
    { name: "CTC", logo: "/logos/collage/ctc.png?v=3", url: "https://www.chicagotrading.com" },
    { name: "D.E. Shaw", bg: "#231F20", logo: "/logos/collage/d-e--shaw.png?v=3", url: "https://www.deshaw.com" },
    { name: "DRW", bg: "#233B57", logo: "/logos/collage/drw.png?v=3", url: "https://drw.com" },
    { name: "Five Rings", logo: "/logos/collage/five-rings.png?v=4", url: "https://fiverings.com" },
    { name: "Flow Traders", bg: "#000000", logo: "/logos/collage/flow-traders.png?v=3", url: "https://www.flowtraders.com" },
    { name: "Goldman Sachs", logo: "/logos/collage/goldman-sachs.png?v=3", url: "https://www.goldmansachs.com" },
    { name: "Hudson River Trading", logo: "/logos/collage/hudson-river-trading.png?v=3", url: "https://www.hudsonrivertrading.com" },
    { name: "IMC", bg: "#0A2540", logo: "/logos/collage/imc.png?v=3", url: "https://www.imc.com" },
    { name: "J.P. Morgan", logo: "/logos/collage/j-p--morgan.png?v=3", url: "https://www.jpmorgan.com" },
    { name: "Jane Street", bg: "#1B459A", logo: "/logos/collage/jane-street.png?v=3", url: "https://www.janestreet.com" },
    { name: "Jump Trading", bg: "#BA194A", logo: "/logos/collage/jump-trading.png?v=3", url: "https://www.jumptrading.com" },
    { name: "Man Group", logo: "/logos/collage/man-group.png?v=3", url: "https://www.man.com" },
    { name: "Millennium", bg: "#0032FF", logo: "/logos/collage/millennium.png?v=3", url: "https://www.millennium.com" },
    { name: "Morgan Stanley", logo: "/logos/collage/morgan-stanley.png?v=3", url: "https://www.morganstanley.com" },
    { name: "Optiver", logo: "/logos/collage/optiver.png?v=3", url: "https://www.optiver.com" },
    { name: "Point72", bg: "#2877C0", logo: "/logos/collage/point72.png?v=3", url: "https://www.point72.com" },
    { name: "SIG", logo: "/logos/collage/sig.png?v=3", url: "https://www.sig.com" },
    { name: "Two Sigma", bg: "#17A5A8", logo: "/logos/collage/two-sigma.png?v=3", url: "https://www.twosigma.com" },
];

export default function FirmsCollage({ aside }: { aside?: ReactNode }) {
    return (
        <section className={aside ? "py-12 sm:py-16 lg:py-8" : "py-12 sm:py-16"}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="chevron chevron-navy text-[1.4rem]">Where Our Members Land</div>
                <div className={aside ? "firm-split mt-7 grid gap-8 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]" : "mt-7"}>
                    <div className={`firm-collage mx-auto w-full${aside ? " firm-collage-fill" : ""}`} style={aside ? undefined : { maxWidth: "820px" }}>
                        {firms.map((firm) => (
                            <a
                                key={firm.name}
                                href={firm.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="firm-tile"
                                style={firm.bg ? { background: firm.bg } : undefined}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- static mixed-size logo grid */}
                                <img src={firm.logo} alt={firm.name} />
                            </a>
                        ))}
                    </div>
                    {aside}
                </div>
            </div>
        </section>
    );
}
