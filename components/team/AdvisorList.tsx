import { sortByExecRole } from "@/lib/exec-order";

interface Advisor {
    name: string;
    /** Small line under the name: a company, or a role for executive boards. */
    tag?: string;
    linkedin: string;
}

interface AdvisorListProps {
    title?: string;
    advisors: Advisor[];
    /** Executive boards: order by role (President first, see lib/exec-order.ts) instead of by name. */
    byRole?: boolean;
}

export default function AdvisorList({ title, advisors, byRole = false }: AdvisorListProps) {
    const shown = byRole ? sortByExecRole(advisors, (a) => a.tag) : [...advisors].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            {title && <h3 className="font-display font-bold text-lg text-navy mb-5">{title}</h3>}
            <div className="flex flex-wrap gap-3">
                {shown.map((advisor) => (
                    <a
                        key={advisor.name}
                        href={advisor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="advisor-btn"
                    >
                        <span className="who">{advisor.name}</span>
                        {advisor.tag && <span className="co">{advisor.tag}</span>}
                    </a>
                ))}
            </div>
        </div>
    );
}
