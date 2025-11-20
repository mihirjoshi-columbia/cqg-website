"use client";

import { motion } from "framer-motion";

const sponsors = [
    { name: "Sponsor 1", logo: "/placeholder-logo.png" },
    { name: "Sponsor 2", logo: "/placeholder-logo.png" },
    { name: "Sponsor 3", logo: "/placeholder-logo.png" },
    { name: "Sponsor 4", logo: "/placeholder-logo.png" },
];

export default function Sponsors() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-columbia-dark">
                        Our Sponsors
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                    {sponsors.map((sponsor, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="flex justify-center"
                        >
                            <div className="h-24 w-full bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                                <span className="text-gray-400 font-medium">{sponsor.name}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
