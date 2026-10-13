import { rankLabel, suitSymbol } from "@/lib/game/mtm/deck";
import type { Card } from "@/lib/game/mtm/types";

type Size = "big" | "mid";

export function PlayingCard({ card, size = "mid" }: { card: Card; size?: Size }) {
    const red = card.suit === "D";
    return (
        <span className={`mtm-card mtm-card--${size}${red ? " mtm-card--red" : ""}`}>
            <span>{rankLabel(card.rank)}</span>
            <span className="mtm-card__suit">{suitSymbol(card.suit)}</span>
        </span>
    );
}

export function CardBack({ size = "mid" }: { size?: Size }) {
    return <span className={`mtm-card mtm-card--back mtm-card--${size}`}>?</span>;
}
