import CareerLines from "@/components/team/CareerLines";
import { careerLineCount } from "@/lib/data/careers";
import { lineageFamilies, type LineageFamily, type LineagePerson } from "@/lib/data/lineage";

function Name({ person, className, reserve = 0 }: { person: LineagePerson; className: string; reserve?: number }) {
    const content = (
        <>
            <span>{person.name}</span>
            <CareerLines career={person} reserve={reserve} />
        </>
    );
    return person.linkedin ? (
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={className}>
            {content}
        </a>
    ) : (
        <span className={className}>{content}</span>
    );
}

function Family({ family }: { family: LineageFamily }) {
    // Littles with career lines stack them under the name; every pill in the family reserves the same height.
    const reserve = Math.max(0, ...family.littles.map(careerLineCount));
    return (
        <div className="lineage-family">
            <Name person={family.big} className="lineage-big" />
            <ul className="lineage-littles">
                {family.littles.map((little) => (
                    <li key={little.name}>
                        <Name person={little} className="lineage-little" reserve={reserve} />
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
