"use client";

import { useState } from "react";
import { edgeOf } from "@/lib/game/mtm/engine";
import { fmt } from "@/lib/game/mtm/format";
import { MTM_PRESETS } from "@/lib/game/mtm/presets";
import type { MtmSettledState } from "@/lib/game/mtm/project";
import { PlayingCard } from "./Card";

type SendState = "idle" | "sending" | "sent" | "failed";

export default function Done({
    state,
    token,
    onReset,
}: {
    state: MtmSettledState;
    token: string | null;
    onReset: () => void;
}) {
    const pnl = state.finalPnl;
    const settle = state.trueValue;
    const position = state.position ?? 0;

    const [send, setSend] = useState<SendState>("idle");
    const [sendError, setSendError] = useState<string | null>(null);

    // The request carries only the sealed token. The score is recomputed
    // server-side and the recipient is a server-side constant, so there is
    // nothing here for a player to edit.
    const email = async () => {
        setSend("sending");
        setSendError(null);
        try {
            const response = await fetch("/api/game/mtm/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload?.error ?? "Could not send.");
            setSend("sent");
        } catch (e) {
            setSend("failed");
            setSendError(e instanceof Error ? e.message : "Could not send.");
        }
    };

    return (
        <div className="mtm-stack">
            <div className="mtm-panel">
                <div className="mtm-panel__label">
                    Final P&amp;L · {MTM_PRESETS[state.preset].label}
                </div>
                <div className={`mtm-headline ${pnl >= 0 ? "mtm-buy" : "mtm-sell"}`}>
                    {pnl >= 0 ? "+" : ""}
                    {fmt(pnl)}
                </div>
                <div className="mtm-muted mtm-spaced">
                    The nine cards totalled <span className="mtm-accent mtm-strong">{settle}</span>{" "}
                    at settlement. You finished{" "}
                    <span className={position > 0 ? "mtm-buy" : position < 0 ? "mtm-sell" : ""}>
                        {position > 0 ? "long " : position < 0 ? "short " : "flat "}
                        {Math.abs(position)} lots
                    </span>
                    .
                </div>

                <div className="mtm-submit">
                    {send === "sent" ? (
                        <p className="mtm-accent mtm-small" role="status">
                            Score sent. It was scored on the server, so that&apos;s the hand as you
                            actually played it.
                        </p>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="mtm-btn mtm-btn--primary"
                                onClick={email}
                                disabled={send === "sending" || !token}
                            >
                                {send === "sending" ? "Sending…" : "Email my score"}
                            </button>
                            <p className="mtm-muted mtm-small mtm-spaced">
                                Sends this result straight to Mihir. The P&amp;L is recomputed
                                server-side from your sealed hand, not taken from your browser.
                            </p>
                        </>
                    )}
                    {send === "failed" && sendError && (
                        <p className="mtm-sell mtm-small mtm-spaced" role="alert">
                            {sendError}
                        </p>
                    )}
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
                            {state.makerResults.map((maker) => (
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
                            {state.settledCommunity.map((card, i) => (
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
