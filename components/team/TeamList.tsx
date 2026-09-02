interface Member {
    name: string;
    linkedin: string;
}

interface TeamListProps {
    title: string;
    members: Member[];
}

export default function TeamList({ title, members }: TeamListProps) {
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display font-extrabold text-2xl text-navy mb-6">{title}</h2>
                <div className="flex flex-wrap gap-2.5">
                    {sorted.map((member) => (
                        <a
                            key={member.name}
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="member-chip hover:text-sky-deep transition-colors"
                        >
                            {member.name}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
