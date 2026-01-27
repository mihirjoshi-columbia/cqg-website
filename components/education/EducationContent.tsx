"use client";

import { motion } from "framer-motion";
import { BookOpen, Video, Users } from "lucide-react";

const lectures = [
    {
        title: "Introduction to Quant Finance",
        description: "An overview of the industry, roles, and basic concepts.",
        icon: <BookOpen className="w-6 h-6 text-columbia-secondary" />,
    },
    {
        title: "Stochastic Calculus",
        description: "Deep dive into the mathematics powering modern finance.",
        icon: <Video className="w-6 h-6 text-columbia-secondary" />,
    },
    {
        title: "Algorithmic Trading",
        description: "Strategies, backtesting, and execution.",
        icon: <Users className="w-6 h-6 text-columbia-secondary" />,
    },
];

export default function EducationContent() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {lectures.map((lecture, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                                {lecture.icon}
                            </div>
                            <h3 className="text-xl font-bold text-columbia-dark mb-3">{lecture.title}</h3>
                            <p className="text-gray-600">{lecture.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
