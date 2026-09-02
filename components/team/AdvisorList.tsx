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
        <div>
            <h3 className="font-display font-bold text-lg text-navy mb-5">{title}</h3>
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
    );
}
