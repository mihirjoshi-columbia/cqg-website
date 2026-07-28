"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Trophy, Gamepad2, Users, Presentation, LineChart } from "lucide-react";

const events = [
    {
        title: "The Future of Quant Investing",
        type: "Speaker Series",
        icon: Presentation,
        description: "An insightful discussion featuring industry leaders on key trends, technological shifts, and algorithmic strategies shaping modern quantitative finance.",
    },
    {
        title: "HRT Algo Arena",
        type: "Competition",
        icon: Gamepad2,
        description: "A fast-paced algorithmic trading tournament hosted in collaboration with Hudson River Trading.",
    },
    {
        title: "Intercollegiate Math Tournament",
        type: "Competition",
        icon: Trophy,
        description: "A collegiate mathematics competition bringing together top quantitative problem solvers.",
    },
    {
        title: "Two Sigma Quant Research Meet & Greet",
        type: "Networking & Info Session",
        icon: Users,
        description: "An exclusive networking event with Two Sigma researchers and engineers discussing quantitative research opportunities.",
    },
    {
        title: "Five Rings Trading Game & Information Session",
        type: "Interactive Workshop",
        icon: LineChart,
        description: "Hands-on trading simulation game and interactive information session led by Five Rings traders.",
    },
    {
        title: "Old Mission Market-Making Game & Information Session",
        type: "Interactive Workshop",
        icon: Calendar,
        description: "Market-making simulation and career panel exploring liquidity provision with Old Mission Capital.",
    },
];

export default function Spring2026EventsPage() {
    return (
        <div className="min-h-screen bg-white pt-24 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

                {/* Timeline */}
                <div className="relative border-l-2 border-columbia-blue/40 ml-4 sm:ml-32 space-y-12 my-12">
                    {events.map((event, index) => {
                        const IconComponent = event.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="relative pl-8 sm:pl-10"
                            >
                                {/* Timeline Dot / Node Icon */}
                                <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-columbia-dark text-white flex items-center justify-center shadow-md ring-4 ring-white">
                                    <IconComponent className="w-4 h-4" />
                                </div>

                                {/* Event Card */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-columbia-dark border border-gray-200">
                                            {event.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-columbia-dark group-hover:text-columbia-secondary transition-colors mb-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
