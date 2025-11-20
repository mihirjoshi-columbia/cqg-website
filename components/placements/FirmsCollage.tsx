"use client";

import { motion } from "framer-motion";

const firms = [
    "Jane Street", "Citadel", "Two Sigma", "D.E. Shaw", "Hudson River Trading",
    "Jump Trading", "Five Rings", "Tower Research", "Optiver", "IMC",
    "Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "BlackRock",
    "Point72", "Millennium", "Bridgewater", "AQR", "Man Group"
];

export default function FirmsCollage() {
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

                <div className="flex flex-wrap justify-center gap-6">
                    {firms.map((firm, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="bg-gray-50 px-6 py-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <span className="text-lg font-semibold text-columbia-dark">{firm}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
