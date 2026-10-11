import { lineageFamilies, type LineageFamily } from "@/lib/data/lineage";

function Name({ person, className }: { person: { name: string; linkedin?: string }; className: string }) {
    return person.linkedin ? (
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={className}>
            {person.name}
        </a>
    ) : (
        <span className={className}>{person.name}</span>
    );
}

function Family({ family }: { family: LineageFamily }) {
    return (
        <div className="lineage-family">
            <Name person={family.big} className="lineage-big" />
            <ul className="lineage-littles">
                {family.littles.map((little) => (
                    <li key={little.name}>
                        <Name person={little} className="lineage-little" />
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
