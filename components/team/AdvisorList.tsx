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
    const sorted = [...advisors].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <section className="bg-paper-alt py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display font-extrabold text-2xl text-navy mb-6">{title}</h2>
                <div className="flex flex-wrap gap-3">
                    {sorted.map((advisor) => (
                        <a
                            key={advisor.name}
                            href={advisor.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="advisor-btn"
                        >
                            <span className="who">{advisor.name}</span>
                            <span className="co">{advisor.company || "—"}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
