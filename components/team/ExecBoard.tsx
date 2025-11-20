"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";

const execBoard = [
    { name: "Executive 1", role: "President", image: "/placeholder-user.jpg", linkedin: "https://linkedin.com" },
    { name: "Executive 2", role: "Vice President", image: "/placeholder-user.jpg", linkedin: "https://linkedin.com" },
    { name: "Executive 3", role: "Treasurer", image: "/placeholder-user.jpg", linkedin: "https://linkedin.com" },
    { name: "Executive 4", role: "Secretary", image: "/placeholder-user.jpg", linkedin: "https://linkedin.com" },
];

export default function ExecBoard() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-columbia-dark mb-12 text-center">Executive Board</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {execBoard.map((exec, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                        >
                            <Link href={exec.linkedin} target="_blank" rel="noopener noreferrer">
                                <div className="aspect-square relative bg-gray-200 overflow-hidden">
                                    {/* Placeholder for image - in real app use next/image with actual src */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <span className="text-4xl">👤</span>
                                    </div>
                                    <div className="absolute inset-0 bg-columbia-dark/0 group-hover:bg-columbia-dark/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Linkedin className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <div className="p-4 text-center">
                                    <h3 className="font-bold text-lg text-columbia-dark">{exec.name}</h3>
                                    <p className="text-columbia-secondary font-medium">{exec.role}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
