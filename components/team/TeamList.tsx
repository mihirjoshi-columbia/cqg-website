"use client";

import Link from "next/link";

interface Member {
    name: string;
    linkedin: string;
}

interface TeamListProps {
    title: string;
    members: Member[];
}

export default function TeamList({ title, members }: TeamListProps) {
    return (
        <section className="py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-columbia-dark mb-8 text-center border-b border-gray-200 pb-4">
                    {title}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-center md:text-left">
                    {members.map((member, index) => (
                        <Link
                            key={index}
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-columbia-secondary transition-colors font-medium block py-1"
                        >
                            {member.name}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
