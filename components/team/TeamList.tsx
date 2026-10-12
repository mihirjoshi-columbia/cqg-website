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
    // If anyone in the list has career lines, every pill is as tall as the tallest and
    // its contents are centered, so names without lines sit in the middle.
    const lines = Math.max(0, ...sorted.map(careerLineCount));
    const chip = lines > 0 ? "member-chip member-chip-stacked" : "member-chip";
    const style = lines > 0 ? ({ "--lines": lines } as React.CSSProperties) : undefined;

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
                            style={style}
                        >
                            <span>
                                {member.name}
                                {member.firstYear && <FirstYearMark />}
                            </span>
                            <CareerLines career={member} />
                        </a>
                    ) : (
                        <span key={member.name} className={chip} style={style}>
                            <span>
                                {member.name}
                                {member.firstYear && <FirstYearMark />}
                            </span>
                            <CareerLines career={member} />
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
