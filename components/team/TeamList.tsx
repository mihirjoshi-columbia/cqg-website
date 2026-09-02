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
        <div>
            <h3 className="font-display font-bold text-lg text-navy mb-5">{title}</h3>
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
    );
}
