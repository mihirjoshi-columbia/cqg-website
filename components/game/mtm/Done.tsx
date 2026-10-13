"use client";

import { edgeOf, finalPnl, trueValue, type GameState } from "@/lib/game/mtm/engine";
import { fmt } from "@/lib/game/mtm/format";
import { MTM_PRESETS, type MtmPreset } from "@/lib/game/mtm/presets";
import { PlayingCard } from "./Card";

export default function Done({
    state,
    preset,
    onReset,
}: {
    state: GameState;
    preset: MtmPreset;
    onReset: () => void;
}) {
    const pnl = finalPnl(state);
    const settle = trueValue(state);

    return (
        <div className="mtm-stack">
            <div className="mtm-panel">
                <div className="mtm-panel__label">Final P&amp;L · {MTM_PRESETS[preset].label}</div>
                <div className={`mtm-headline ${pnl >= 0 ? "mtm-buy" : "mtm-sell"}`}>
                    {pnl >= 0 ? "+" : ""}
                    {fmt(pnl)}
                </div>
                <div className="mtm-muted mtm-spaced">
                    The nine cards totalled <span className="mtm-accent mtm-strong">{settle}</span>{" "}
                    at settlement. You finished{" "}
                    <span
                        className={
                            state.position > 0
                                ? "mtm-buy"
                                : state.position < 0
                                  ? "mtm-sell"
                                  : ""
                        }
                    >
                        {state.position > 0 ? "long " : state.position < 0 ? "short " : "flat "}
                        {Math.abs(state.position)} lots
                    </span>
                    .
                </div>
            </div>

            <div className="mtm-panel">
                <div className="mtm-panel__label">The full deal</div>
                <div className="mtm-grid-2">
                    <div>
                        <div className="mtm-muted mtm-small mtm-spaced">Private cards</div>
                        <div className="mtm-row mtm-row--wrap">
                            <figure className="mtm-reveal">
                                <PlayingCard card={state.playerCard} />
                                <figcaption>You ({state.playerCard.value})</figcaption>
                            </figure>
                            {state.makers.map((maker) => (
                                <figure className="mtm-reveal" key={maker.id}>
                                    <PlayingCard card={maker.card} />
                                    <figcaption>
                                        {maker.name} ({maker.card.value})
                                    </figcaption>
                                    <figcaption className="mtm-dim mtm-mono">
                                        {maker.style} · {maker.fills} fills · inv{" "}
                                        {maker.inventory > 0 ? "+" : ""}
                                        {maker.inventory}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="mtm-muted mtm-small mtm-spaced">
                            Face-down cards (all settle)
                        </div>
                        <div className="mtm-row mtm-row--wrap">
                            {state.community.map((card, i) => (
                                <figure className="mtm-reveal" key={i}>
                                    <PlayingCard card={card} />
                                    <figcaption>{card.value}</figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {state.trades.length > 0 && (
                <div className="mtm-panel">
                    <div className="mtm-panel__label">Trade log</div>
                    <div className="mtm-log mtm-log--tall">
                        {state.trades.map((t, i) => (
                            <div key={i}>
                                <span className="mtm-dim">R{t.round + 1}</span>{" "}
                                <span className={t.side === "buy" ? "mtm-buy" : "mtm-sell"}>
                                    {t.side.toUpperCase()}
                                </span>{" "}
                                {t.qty} @ {t.price}{" "}
                                <span className="mtm-dim">· {t.counterparty}</span>{" "}
                                <span className="mtm-dim">(edge {edgeOf(t, settle)})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button type="button" className="mtm-btn mtm-btn--primary" onClick={onReset}>
                New hand
            </button>
        </div>
    );
}
