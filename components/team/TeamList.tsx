interface Member {
    name: string;
    /** Omit when we don't have one; the name then shows as a plain, non-clickable chip. */
    linkedin?: string;
}

interface TeamListProps {
    title?: string;
    members: Member[];
}

export default function TeamList({ title, members }: TeamListProps) {
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            {title && <h3 className="font-display font-bold text-lg text-navy mb-5">{title}</h3>}
            <div className="flex flex-wrap gap-2.5">
                {sorted.map((member) =>
                    member.linkedin ? (
                        <a
                            key={member.name}
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="member-chip hover:text-sky-deep transition-colors"
                        >
                            {member.name}
                        </a>
                    ) : (
                        <span key={member.name} className="member-chip">
                            {member.name}
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
