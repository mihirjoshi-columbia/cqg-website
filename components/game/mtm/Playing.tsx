"use client";

import { fmt } from "@/lib/game/mtm/format";
import type { MtmPublicState } from "@/lib/game/mtm/project";
import type { Side } from "@/lib/game/mtm/types";
import { CardBack, PlayingCard } from "./Card";

export default function Playing({
    state,
    onTrade,
    onPass,
    onAdvance,
    busy,
}: {
    state: MtmPublicState;
    onTrade: (makerIndex: number, side: Side) => void;
    onPass: (makerIndex: number) => void;
    onAdvance: () => void;
    busy: boolean;
}) {
    const { quotes, makers, roundActions, activeMaker, hardMode, expertMode, showEstimate } = state;
    const done = state.roundComplete;
    const last = state.isLastRound;

    return (
        <div className="mtm-stack">
            <div className="mtm-statusbar">
                <div className="mtm-stat">
                    <div className="mtm-stat__label">Round</div>
                    <div className="mtm-stat__value">
                        {state.round + 1} / {state.totalRounds}
                    </div>
                </div>

                {/* In hard mode the server does not even send these. */}
                {!hardMode && (
                    <>
                        <div className="mtm-stat">
                            <div className="mtm-stat__label">Position</div>
                            <div
                                className={`mtm-stat__value ${
                                    (state.position ?? 0) > 0
                                        ? "mtm-buy"
                                        : (state.position ?? 0) < 0
                                          ? "mtm-sell"
                                          : ""
                                }`}
                            >
                                {(state.position ?? 0) > 0 ? "+" : ""}
                                {state.position ?? 0}
                            </div>
                        </div>
                        <div className="mtm-stat">
                            <div className="mtm-stat__label">Cash</div>
                            <div className="mtm-stat__value">{fmt(state.cash ?? 0)}</div>
                        </div>
                        <div className="mtm-stat">
                            <div className="mtm-stat__label">Avg entry</div>
                            <div className="mtm-stat__value">
                                {(state.position ?? 0) === 0 ? "—" : fmt(state.avgEntry ?? 0)}
                            </div>
                        </div>
                        <div className="mtm-stat">
                            <div className="mtm-stat__label">Est. mark P&amp;L</div>
                            <div
                                className={`mtm-stat__value ${
                                    (state.markPnl ?? 0) >= 0 ? "mtm-buy" : "mtm-sell"
                                }`}
                            >
                                {fmt(state.markPnl ?? 0)}
                            </div>
                            <div className="mtm-stat__note">vs your est. fair</div>
                        </div>
                    </>
                )}

                {hardMode && !expertMode && (
                    <div className="mtm-stat mtm-stat--note mtm-warn">
                        Hard — trading blind until settlement.
                    </div>
                )}
                {expertMode && (
                    <div className="mtm-stat mtm-stat--note mtm-warn">
                        Expert — blind, tighter markets, sharper makers.
                    </div>
                )}
            </div>

            <div className="mtm-grid-2">
                <div className="mtm-panel">
                    <div className="mtm-panel__label">Your hole card</div>
                    <div className="mtm-row mtm-row--gap">
                        <PlayingCard card={state.playerCard} size="big" />
                        <div className="mtm-muted">
                            <div>
                                Value: <span className="mtm-strong">{state.playerCard.value}</span>
                            </div>
                            {showEstimate && state.fairEstimate !== undefined && (
                                <div className="mtm-spaced">
                                    Your est. fair:{" "}
                                    <span className="mtm-accent mtm-strong">
                                        {state.fairEstimate}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mtm-panel">
                    <div className="mtm-panel__label">Face-down cards</div>
                    <div className="mtm-row mtm-row--wrap">
                        {state.community.map((card, i) =>
                            card ? <PlayingCard key={i} card={card} /> : <CardBack key={i} />
                        )}
                    </div>
                    <p className="mtm-muted mtm-small mtm-spaced">
                        {state.revealed} of {state.communityCount} revealed.
                    </p>
                </div>
            </div>

            <div className="mtm-panel">
                <div className="mtm-row mtm-row--between">
                    <div className="mtm-panel__label">Markets on the nine-card total</div>
                    <div className="mtm-muted mtm-small">
                        1 lot a side · buy lifts the offer, sell hits the bid
                    </div>
                </div>

                <div className="mtm-quotes">
                    {makers.map((maker, i) => {
                        const quote = quotes[i];
                        // The server sends nothing past the live maker, so
                        // there is no reading ahead even from the console.
                        if (!quote) return null;
                        const live = i === activeMaker;
                        const action = roundActions[i];
                        return (
                            <div
                                key={maker.id}
                                className={`mtm-quote${live ? " mtm-quote--live" : ""}`}
                            >
                                <div className="mtm-quote__who">
                                    <div className="mtm-strong">{maker.name}</div>
                                    <div className="mtm-quote__style">{maker.style}</div>
                                </div>

                                <div className="mtm-quote__market">
                                    <span className="mtm-sell mtm-mono">
                                        {quote.bidSize} × {quote.bid}
                                    </span>
                                    <span className="mtm-dim">/</span>
                                    <span className="mtm-buy mtm-mono">
                                        {quote.ask} × {quote.askSize}
                                    </span>
                                    <span className="mtm-dim mtm-small">
                                        ({quote.ask - quote.bid} wide)
                                    </span>
                                </div>

                                <div className="mtm-quote__actions">
                                    {live ? (
                                        <>
                                            <button
                                                type="button"
                                                className="mtm-btn mtm-btn--sell"
                                                disabled={busy}
                                                onClick={() => onTrade(i, "sell")}
                                            >
                                                Sell {quote.bidSize} @ {quote.bid}
                                            </button>
                                            <button
                                                type="button"
                                                className="mtm-btn mtm-btn--buy"
                                                disabled={busy}
                                                onClick={() => onTrade(i, "buy")}
                                            >
                                                Buy {quote.askSize} @ {quote.ask}
                                            </button>
                                            <button
                                                type="button"
                                                className="mtm-btn mtm-btn--neutral"
                                                disabled={busy}
                                                onClick={() => onPass(i)}
                                            >
                                                Pass
                                            </button>
                                        </>
                                    ) : action === "pass" ? (
                                        <span className="mtm-dim mtm-small">Passed</span>
                                    ) : action === "buy" ? (
                                        <span className="mtm-buy mtm-small">
                                            You bought {quote.askSize} @ {quote.ask}
                                        </span>
                                    ) : action === "sell" ? (
                                        <span className="mtm-sell mtm-small">
                                            You sold {quote.bidSize} @ {quote.bid}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p className="mtm-muted mtm-small mtm-spaced">
                    {done ? (
                        <span className="mtm-accent">Every market answered.</span>
                    ) : (
                        "The makers quote one at a time. Take a lot or wave it off."
                    )}
                </p>
            </div>

            <div className="mtm-row mtm-row--between">
                <div className="mtm-muted mtm-small">
                    {!done
                        ? "Work through all four markets to close the round."
                        : last
                          ? "Final round — settle and turn everything face up."
                          : "Turn the next card over to carry on."}
                </div>
                <button
                    type="button"
                    className="mtm-btn mtm-btn--primary"
                    disabled={!done || busy}
                    onClick={onAdvance}
                >
                    {last ? "Settle →" : "Flip community card →"}
                </button>
            </div>

            {state.trades && state.trades.length > 0 && (
                <div className="mtm-panel">
                    <div className="mtm-panel__label">Trade log</div>
                    <div className="mtm-log">
                        {state.trades.map((t, i) => (
                            <div key={i}>
                                <span className="mtm-dim">R{t.round + 1}</span>{" "}
                                <span className={t.side === "buy" ? "mtm-buy" : "mtm-sell"}>
                                    {t.side.toUpperCase()}
                                </span>{" "}
                                {t.qty} @ {t.price}{" "}
                                <span className="mtm-dim">· {t.counterparty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
