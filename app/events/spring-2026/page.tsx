"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const events = [
    {
        title: "The Future of Quant Investing",
        image: "/events/future-of-quant-investing.jpg",
        description: null,
    },
    {
        title: "HRT Algo Arena",
        description: "A competition-style challenge that invites students to construct rules that predict returns from Bloomberg headline data, hosted with Hudson River Trading",
    },
    {
        title: "Intercollegiate Math Tournament",
        description: "Hosted with ICMT, a collegiate mathematics competition bringing together top quantitative problem solvers.",
    },
    {
        title: "Two Sigma Quant Research Meet & Greet",
        image: "/events/two-sigma-meet-and-greet.jpg",
        description: null,
    },
    {
        title: "Five Rings Trading Game & Information Session",
        image: "/events/five-rings-trading-game.png",
        description: null,
    },
    {
        title: "Old Mission Market-Making Game & Information Session",
        image: "/events/old-mission.png",
        description: null,
    },
];

export default function Spring2026EventsPage() {
    return (
        <div className="min-h-screen bg-white pt-24 pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button & Breadcrumb */}
                <div className="mb-8">
                    <Link
                        href="/events"
                        className="inline-flex items-center text-sm font-medium text-columbia-secondary hover:text-columbia-dark transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-columbia-dark bg-columbia-blue/30 rounded-full uppercase mb-3">
                        Semester Schedule
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-columbia-dark mb-4">
                        Spring 2026 Events
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore our lineup of speaker panels, trading games, competitions, and employer networking sessions for Spring 2026.
                    </p>
                </div>

                {/* Alternating Two-Sided Timeline */}
                <div className="relative my-12">
                    {/* Vertical Center Line (Desktop md:left-1/2, Mobile left-6) */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-columbia-blue/40 -translate-x-1/2" />

                    <div className="space-y-12">
                        {events.map((event, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="relative flex flex-col md:flex-row items-center"
                                >
                                    {/* Timeline Node Plain Dot */}
                                    <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-10 w-4 h-4 rounded-full bg-columbia-dark shadow-sm ring-4 ring-white" />

                                    {/* Content Container */}
                                    <div className={`w-full flex ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                                        <div className={`w-full md:w-[calc(50%-2.5rem)] pl-14 md:pl-0 ${isEven ? 'md:pr-4' : 'md:pl-4'}`}>
                                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                                                <h3 className="text-xl font-bold text-columbia-dark group-hover:text-columbia-secondary transition-colors mb-3">
                                                    {event.title}
                                                </h3>

                                                {event.image ? (
                                                    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                        <Image
                                                            src={event.image}
                                                            alt={event.title}
                                                            width={600}
                                                            height={750}
                                                            className="w-full h-auto object-cover rounded-lg hover:scale-102 transition-transform duration-300"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
