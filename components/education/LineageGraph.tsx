import CareerLines from "@/components/team/CareerLines";
import { careerLineCount } from "@/lib/data/careers";
import { lineageFamilies, type LineageFamily, type LineagePerson } from "@/lib/data/lineage";

function Name({ person, className, lines = 0 }: { person: LineagePerson; className: string; lines?: number }) {
    const content = (
        <>
            <span>{person.name}</span>
            <CareerLines career={person} />
        </>
    );
    // Pills in a family with career lines are all the same height, with their contents centered.
    const stacked = lines > 0 ? `${className} lineage-little-stacked` : className;
    const style = lines > 0 ? ({ "--lines": lines } as React.CSSProperties) : undefined;
    return person.linkedin ? (
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={stacked} style={style}>
            {content}
        </a>
    ) : (
        <span className={stacked} style={style}>
            {content}
        </span>
    );
}

function Family({ family }: { family: LineageFamily }) {
    const lines = Math.max(0, ...family.littles.map(careerLineCount));
    return (
        <div className="lineage-family">
            <Name person={family.big} className="lineage-big" />
            <ul className="lineage-littles">
                {family.littles.map((little) => (
                    <li key={little.name}>
                        <Name person={little} className="lineage-little" lines={lines} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function LineageGraph() {
    return (
        <div className="lineage-graph">
            {lineageFamilies.map((family) => (
                <Family key={family.big.name} family={family} />
            ))}
        </div>
    );
}
