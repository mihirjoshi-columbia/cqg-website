import { sortByExecRole } from "@/lib/exec-order";
import FirstYearMark from "./FirstYearMark";
import CareerLines from "./CareerLines";
import type { Career } from "@/lib/data/careers";

interface Advisor extends Career {
    name: string;
    /** Small line under the name: a company, or a role for executive boards. */
    tag?: string;
    /** Omit when we couldn't find one; the card then shows as plain, non-clickable text. */
    linkedin?: string;
    /** Their first year in CQG: shows an asterisk after the name. */
    firstYear?: boolean;
}

interface AdvisorListProps {
    title?: string;
    advisors: Advisor[];
    /** Executive boards: order by role (President first, see lib/exec-order.ts) instead of by name. */
    byRole?: boolean;
    /** With byRole, break ties between people of the same role by name instead of the given order. */
    thenByName?: boolean;
}

export default function AdvisorList({ title, advisors, byRole = false, thenByName = false }: AdvisorListProps) {
    const shown = byRole ? sortByExecRole(advisors, (a) => a.tag, thenByName ? (a) => a.name : undefined) : [...advisors].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            {title && <h3 className="font-display font-bold text-lg text-navy mb-5">{title}</h3>}
            <div className="flex flex-wrap gap-3">
                {shown.map((advisor) => {
                    const content = (
                        <>
                            <span className="who">
                                {advisor.name}
                                {advisor.firstYear && <FirstYearMark />}
                            </span>
                            {advisor.tag && <span className="co">{advisor.tag}</span>}
                            <CareerLines career={advisor} />
                        </>
                    );
                    return advisor.linkedin ? (
                        <a
                            key={advisor.name}
                            href={advisor.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="advisor-btn"
                        >
                            {content}
                        </a>
                    ) : (
                        <span key={advisor.name} className="advisor-btn advisor-btn-static">
                            {content}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
