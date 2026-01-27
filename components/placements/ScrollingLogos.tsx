"use client";

import { motion } from "framer-motion";

const firms = [
    "Jane Street", "Citadel", "Two Sigma", "D.E. Shaw", "Hudson River Trading",
    "Jump Trading", "Five Rings", "Tower Research", "Optiver", "IMC",
    "Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "BlackRock"
];

export default function ScrollingLogos() {
    return (
        <section className="py-16 bg-gray-50 overflow-hidden">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-columbia-dark">Where We Place</h2>
            </div>

            <div className="flex relative">
                <motion.div
                    className="flex space-x-12 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                    }}
                >
                    {[...firms, ...firms, ...firms].map((firm, index) => (
                        <div
                            key={index}
                            className="text-2xl font-bold text-gray-400 grayscale hover:grayscale-0 transition-all duration-300 cursor-default"
                        >
                            {firm}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
