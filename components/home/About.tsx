"use client";

import { motion } from "framer-motion";

export default function About() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-columbia-dark mb-8">
                        What We Do
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
                        We are an educational club focused on teaching <span className="text-columbia-secondary font-semibold">quantitative finance</span>.
                        Our mission is to bridge the gap between academic theory and industry practice,
                        providing students with the skills and network needed to succeed in the world of quantitative finance.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
