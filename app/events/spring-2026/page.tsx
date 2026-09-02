"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const events = [
    {
        title: "The Future of Quant Investing",
        // date: "May 1, 2026",
        image: "/events/future-of-quant-investing.jpg",
        description: null,
    },
    {
        title: "HRT Algo Arena",
        // date: "April 21, 2026",
        description: "A competition-style challenge that invites students to construct rules that predict returns from Bloomberg headline data, hosted with Hudson River Trading.",
    },
    {
        title: "Intercollegiate Math Tournament",
        // date: "February 28, 2026",
        description: (
            <>
                A collegiate mathematics tournament that brings together the top quantitative minds from across the country. Link to ICMT&apos;s website{" "}
                <a
                    href="https://intercollegiatemathtournament.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline hover:opacity-80 transition-opacity font-medium"
                >
                    here.
                </a>
                .
            </>
        ),
    },
    {
        title: "Two Sigma Quant Research Meet & Greet",
        // date: "February 25, 2026",
        image: "/events/two-sigma-meet-and-greet.jpg",
        description: null,
    },
    {
        title: "Five Rings Trading Game & Information Session",
        // date: "February 18, 2026",
        image: "/events/five-rings-trading-game.png",
        description: null,
    },
    {
        title: "Old Mission Market-Making Game & Information Session",
        // date: "February 11, 2026",
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
                        className="inline-flex items-center text-sm font-medium text-sky-deep hover:text-navy transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
                        Spring 2026 Events
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore past events from spring 2026.
                    </p>
                </div>

                {/* Alternating Two-Sided Timeline */}
                <div className="relative my-12">
                    {/* Vertical Center Line (Desktop md:left-1/2, Mobile left-6) */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-sky/40 -translate-x-1/2" />

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
                                    <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-10 w-4 h-4 rounded-full bg-navy shadow-sm ring-4 ring-white" />

                                    {/* Content Container */}
                                    <div className={`w-full flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                        {/* Card Side */}
                                        <div className={`w-full md:w-[calc(50%-2.5rem)] pl-14 md:pl-0 ${isEven ? 'md:pr-4' : 'md:pl-4'}`}>
                                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                                                {/* <span className="block md:hidden italic text-gray-500 text-sm mb-2">
                                                    {event.date}
                                                </span> */}
                                                <h3 className="text-xl font-bold text-navy group-hover:text-sky-deep transition-colors mb-3">
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

                                        {/* Opposite Side Date for Desktop */}
                                        {/* <div className={`hidden md:flex md:w-[calc(50%-2.5rem)] pt-5 ${isEven ? 'md:pl-4 justify-start' : 'md:pr-4 justify-end text-right'}`}>
                                            <span className="italic text-gray-500 font-medium text-lg">
                                                {event.date}
                                            </span>
                                        </div> */}
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
