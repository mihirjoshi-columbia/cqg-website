import FirstYearMark from "./FirstYearMark";
import CareerLines from "./CareerLines";
import { careerLineCount, type Career } from "@/lib/data/careers";

interface Member extends Career {
    name: string;
    /** Omit when we don't have one; the name then shows as a plain, non-clickable chip. */
    linkedin?: string;
    /** Their first year in CQG: shows an asterisk after the name. */
    firstYear?: boolean;
}

interface TeamListProps {
    title?: string;
    members: Member[];
}

export default function TeamList({ title, members }: TeamListProps) {
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));
    // If anyone in the list has career lines, every pill reserves the same number so they line up.
    const reserve = Math.max(0, ...sorted.map(careerLineCount));
    const chip = reserve > 0 ? "member-chip member-chip-stacked" : "member-chip";

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
                            className={`${chip} hover:text-sky-deep transition-colors`}
                        >
                            <span>
                                {member.name}
                                {member.firstYear && <FirstYearMark />}
                            </span>
                            <CareerLines career={member} reserve={reserve} />
                        </a>
                    ) : (
                        <span key={member.name} className={chip}>
                            <span>
                                {member.name}
                                {member.firstYear && <FirstYearMark />}
                            </span>
                            <CareerLines career={member} reserve={reserve} />
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
