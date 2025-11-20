"use client";

import { motion } from "framer-motion";

export default function FirmsCollage() {
    const firms = [
        { name: "Jane Street", logo: "/logos/jane-street.png" },
        { name: "Citadel", logo: "/logos/citadel.png" },
        { name: "Two Sigma", logo: "/logos/two-sigma.png" },
        { name: "D.E. Shaw", logo: "/logos/d-e--shaw.png" },
        { name: "Hudson River Trading", logo: "/logos/hudson-river-trading.png" },
        { name: "Jump Trading", logo: "/logos/jump-trading.png" },
        { name: "Five Rings", logo: "/logos/five-rings.png" },
        { name: "Tower Research", logo: "/logos/tower-research.png" },
        { name: "Optiver", logo: "/logos/optiver.png" },
        { name: "IMC", logo: "/logos/imc.png" },
        { name: "Goldman Sachs", logo: "/logos/goldman-sachs.png" },
        { name: "Morgan Stanley", logo: "/logos/morgan-stanley.png" },
        { name: "J.P. Morgan", logo: "/logos/j-p--morgan.png" },
        { name: "BlackRock", logo: "/logos/blackrock.png" },
        { name: "Point72", logo: "/logos/point72.png" },
        { name: "CTC", logo: "/logos/ctc.png" },
        { name: "SIG", logo: "/logos/sig.png" },
        { name: "Bridgewater", logo: "/logos/bridgewater.png" },
        { name: "AQR", logo: "/logos/aqr.png" },
        { name: "Man Group", logo: "/logos/man-group.png" }
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
                    {firms.map((firm, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="w-40 h-24 flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110"
                        >
                            <img
                                src={firm.logo}
                                alt={`${firm.name} logo`}
                                className="max-w-full max-h-full object-contain"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
