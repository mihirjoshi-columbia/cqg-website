"use client";

import { motion } from "framer-motion";

export default function FirmsCollage() {
    const firms = [
        { name: "Jane Street", logo: "/logos/jane-street.png", url: "https://www.janestreet.com" },
        { name: "Citadel", logo: "/logos/citadel.png", url: "https://www.citadel.com" },
        { name: "Two Sigma", logo: "/logos/two-sigma.png", url: "https://www.twosigma.com" },
        { name: "D.E. Shaw", logo: "/logos/d-e--shaw.png", url: "https://www.deshaw.com" },
        { name: "Hudson River Trading", logo: "/logos/hudson-river-trading.png", url: "https://www.hudsonrivertrading.com" },
        { name: "Jump Trading", logo: "/logos/jump-trading.svg", url: "https://www.jumptrading.com" },
        { name: "Five Rings", logo: "/logos/five-rings.png", url: "https://fiverings.com" },
        { name: "Flow Traders", logo: "/logos/flow-traders.png", url: "https://www.flowtraders.com" },
        { name: "Optiver", logo: "/logos/optiver.png", url: "https://www.optiver.com" },
        { name: "IMC", logo: "/logos/imc.png", url: "https://www.imc.com" },
        { name: "Goldman Sachs", logo: "/logos/goldman-sachs.png", url: "https://www.goldmansachs.com" },
        { name: "Morgan Stanley", logo: "/logos/morgan-stanley.png", url: "https://www.morganstanley.com" },
        { name: "J.P. Morgan", logo: "/logos/j-p--morgan.png", url: "https://www.jpmorgan.com" },
        { name: "BlackRock", logo: "/logos/blackrock.png", url: "https://www.blackrock.com" },
        { name: "Point72", logo: "/logos/point72.png", url: "https://www.point72.com" },
        { name: "CTC", logo: "/logos/ctc.png", url: "https://www.chicagotrading.com" },
        { name: "SIG", logo: "/logos/sig.png", url: "https://www.sig.com" },
        { name: "Bridgewater", logo: "/logos/bridgewater.png", url: "https://www.bridgewater.com" },
        { name: "AQR", logo: "/logos/aqr.png", url: "https://www.aqr.com" },
        { name: "Man Group", logo: "/logos/man-group.png", url: "https://www.man.com" }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-columbia-dark mb-4">
                        Our Alumni Network
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        CQG members have gone on to work at the world's leading quantitative finance firms and investment banks.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {firms.map((firm, index) => (
                        <a
                            key={index}
                            href={firm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center h-32 group"
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={firm.logo}
                                    alt={`${firm.name} logo`}
                                    className="max-w-[90%] max-h-[90%] object-contain filter grayscale opacity-70 group-hover:filter-none group-hover:opacity-100 transition-all duration-300"
                                />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
