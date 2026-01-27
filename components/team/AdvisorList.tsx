"use client";

import Link from "next/link";
import { Linkedin, Building2 } from "lucide-react";

interface Advisor {
    name: string;
    company: string;
    linkedin: string;
}

interface AdvisorListProps {
    title: string;
    advisors: Advisor[];
}

export default function AdvisorList({ title, advisors }: AdvisorListProps) {
    return (
        <section className="py-12 bg-gray-50/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-columbia-dark mb-8 text-center">
                    {title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advisors.map((advisor, index) => (
                        <Link
                            key={index}
                            href={advisor.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-columbia-blue/30 transition-all duration-300 flex flex-col items-start relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Linkedin className="w-5 h-5 text-columbia-blue" />
                            </div>

                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-columbia-blue/10 text-columbia-blue mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-5 h-5" />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-columbia-dark transition-colors">
                                {advisor.name}
                            </h3>

                            <p className="text-columbia-secondary font-medium mt-1 flex items-center gap-2">
                                {advisor.company}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
