"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function EventsPage() {
    return (
        <div className="min-h-screen bg-white pt-24 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-columbia-dark mb-4">
                    Events
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Check out our upcoming and past events, including trading & math competitions, speaker panels, trading games, and information sessions.
                </p>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-columbia-dark mb-6">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link
                            href="/events/spring-2026"
                            className="block p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-columbia-secondary/40 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-columbia-blue/20 rounded-xl text-columbia-dark group-hover:bg-columbia-dark group-hover:text-white transition-colors">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                    6 Events
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-columbia-dark mb-2 flex items-center justify-between">
                                Spring 2026
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-columbia-dark group-hover:translate-x-1 transition-all" />
                            </h3>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
