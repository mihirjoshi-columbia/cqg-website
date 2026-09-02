const firms = [
    { name: "AQR", logo: "/logos/aqr.png", url: "https://www.aqr.com" },
    { name: "BlackRock", logo: "/logos/blackrock.png", url: "https://www.blackrock.com" },
    { name: "Bridgewater", logo: "/logos/bridgewater.png", url: "https://www.bridgewater.com" },
    { name: "Citadel", logo: "/logos/citadel.png", url: "https://www.citadel.com" },
    { name: "CTC", logo: "/logos/ctc.png", url: "https://www.chicagotrading.com" },
    { name: "D.E. Shaw", logo: "/logos/d-e--shaw.png", url: "https://www.deshaw.com" },
    { name: "DRW", logo: "/logos/drw.png", url: "https://drw.com" },
    { name: "Five Rings", logo: "/logos/five-rings.png", url: "https://fiverings.com" },
    { name: "Flow Traders", logo: "/logos/flow-traders.png", url: "https://www.flowtraders.com" },
    { name: "Goldman Sachs", logo: "/logos/goldman-sachs.png", url: "https://www.goldmansachs.com" },
    { name: "Hudson River Trading", logo: "/logos/hudson-river-trading.png", url: "https://www.hudsonrivertrading.com" },
    { name: "IMC", logo: "/logos/imc.png", url: "https://www.imc.com" },
    { name: "J.P. Morgan", logo: "/logos/j-p--morgan.png", url: "https://www.jpmorgan.com" },
    { name: "Jane Street", logo: "/logos/jane-street.png", url: "https://www.janestreet.com" },
    { name: "Jump Trading", logo: "/logos/jump-trading.png", url: "https://www.jumptrading.com" },
    { name: "Man Group", logo: "/logos/man-group.png", url: "https://www.man.com" },
    { name: "Millennium", logo: "/logos/millennium.png", url: "https://www.millennium.com" },
    { name: "Morgan Stanley", logo: "/logos/morgan-stanley.png", url: "https://www.morganstanley.com" },
    { name: "Optiver", logo: "/logos/optiver.png", url: "https://www.optiver.com" },
    { name: "Point72", logo: "/logos/point72.png", url: "https://www.point72.com" },
    { name: "SIG", logo: "/logos/sig.png", url: "https://www.sig.com" },
    { name: "Two Sigma", logo: "/logos/two-sigma.png", url: "https://www.twosigma.com" },
];

export default function FirmsCollage() {
    return (
        <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="chevron chevron-navy text-[1.4rem]">Where Our Members Land</div>
                <div className="firm-collage mt-9">
                    {firms.map((firm) => (
                        <a key={firm.name} href={firm.url} target="_blank" rel="noopener noreferrer" className="firm-tile">
                            {/* eslint-disable-next-line @next/next/no-img-element -- static mixed-size logo grid */}
                            <img
                                src={firm.logo}
                                alt={firm.name}
                                className={firm.name === "DRW" ? "max-w-[46%] max-h-[34%] object-contain" : undefined}
                            />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
