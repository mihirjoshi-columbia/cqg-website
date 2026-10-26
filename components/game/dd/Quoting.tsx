"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicContract, SettledContract } from "@/lib/game/dd/project";

function money(value: number): string {
    return value.toFixed(2);
}

/**
 * The clock is cosmetic pressure only -- the server decides what is late,
 * from when it opened the stage. When it runs out here the quote on screen is
 * submitted as-is rather than nothing, so a player who has typed a sensible
 * market still gets it in.
 */
function useCountdown(seconds: number, onExpire: () => void) {
    const [left, setLeft] = useState(seconds);
    const expired = useRef(false);
    const fire = useRef(onExpire);

    // Kept current in an effect, not during render, so the interval always
    // calls the latest handler without reading a ref while rendering.
    useEffect(() => {
        fire.current = onExpire;
    });

    useEffect(() => {
        const started = Date.now();
        const id = setInterval(() => {
            const remaining = seconds - Math.floor((Date.now() - started) / 1000);
            setLeft(Math.max(0, remaining));
            if (remaining <= 0 && !expired.current) {
                expired.current = true;
                fire.current();
            }
        }, 250);
        return () => clearInterval(id);
    }, [seconds]);

    return left;
}

export default function Quoting({
    contract,
    coaching,
    busy,
    onSubmit,
}: {
    contract: PublicContract;
    coaching: SettledContract | null;
    busy: boolean;
    onSubmit: (bid: number, ask: number) => void;
}) {
    const [bid, setBid] = useState("");
    const [ask, setAsk] = useState("");

    const parsed = useMemo(() => {
        const b = Number.parseFloat(bid);
        const a = Number.parseFloat(ask);
        if (!Number.isFinite(b) || !Number.isFinite(a)) return null;
        if (a - b < 1) return null;
        return { bid: b, ask: a };
    }, [bid, ask]);

    const submit = () => {
        if (!parsed || busy) return;
        onSubmit(parsed.bid, parsed.ask);
    };

    const left = useCountdown(contract.secondsPerQuote, () => {
        // Out of time: send whatever is on screen, or a deliberately
        // unfillable market if nothing usable has been typed.
        if (parsed) onSubmit(parsed.bid, parsed.ask);
        else onSubmit(-1_000_000, 1_000_000);
    });

    const low = left <= 10;

    return (
        <div className="mtm-stack">
            {coaching && (
                <div className="mtm-panel dd-coaching">
                    <p className="mtm-panel__label">Last contract</p>
                    <p className="dd-prose">
                        <strong>{coaching.description}</strong>
                    </p>
                    <p className="dd-prose">
                        It settled at <strong>{money(coaching.settlement)}</strong>. Your P&amp;L:{" "}
                        <strong className={coaching.pnl >= 0 ? "dd-pos" : "dd-neg"}>
                            {money(coaching.pnl)}
                        </strong>
                        .
                    </p>
                    <ul className="mtm-rules">
                        {coaching.stages.map((stage) => (
                            <li key={stage.stage}>
                                {stage.stage === 0 ? "Before the reveal" : "After the reveal"}: fair{" "}
                                <strong>{money(stage.fair)}</strong>, SD{" "}
                                <strong>{money(stage.sd)}</strong>
                                {stage.quote
                                    ? ` — you quoted ${money(stage.quote.bid)} / ${money(stage.quote.ask)}`
                                    : ""}
                            </li>
                        ))}
                    </ul>
                    <p className="dd-prose dd-prose--lesson">{coaching.lesson}</p>
                </div>
            )}

            <div className="mtm-panel">
                <div className="dd-contract-head">
                    <p className="mtm-panel__label">
                        Contract {contract.index + 1} of {contract.total} &middot;{" "}
                        {contract.stage === 0 ? "Opening market" : "Re-quote"}
                    </p>
                    <span className={`dd-clock${low ? " dd-clock--low" : ""}`}>
                        {String(Math.floor(left / 60)).padStart(2, "0")}:
                        {String(left % 60).padStart(2, "0")}
                    </span>
                </div>

                <p className="dd-contract">{contract.description}</p>

                {contract.revealText && (
                    <p className="dd-reveal">
                        <span>Information</span> {contract.revealText}
                    </p>
                )}
            </div>

            <div className="mtm-statusbar dd-statusbar">
                <div className="mtm-stat">
                    <span className="mtm-stat__label">Position</span>
                    <strong>{contract.inventory}</strong>
                </div>
                <div className="mtm-stat">
                    <span className="mtm-stat__label">Cash</span>
                    <strong>{money(contract.cash)}</strong>
                </div>
                <div className="mtm-stat">
                    <span className="mtm-stat__label">Fills</span>
                    <strong>{contract.fills.length}</strong>
                </div>
            </div>

            {contract.fills.length > 0 && (
                <div className="mtm-panel">
                    <p className="mtm-panel__label">Your fills on this contract</p>
                    <ul className="dd-fills">
                        {contract.fills.map((fill, i) => (
                            <li key={i}>
                                <span className={fill.counterparty === "buy" ? "dd-neg" : "dd-pos"}>
                                    {/* Named from the player's side, which is the opposite of the
                                        counterparty's. */}
                                    {fill.counterparty === "buy" ? "You sold" : "You bought"}
                                </span>{" "}
                                1 at {money(fill.price)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mtm-panel">
                <p className="mtm-panel__label">Your market</p>
                <div className="dd-quote-entry">
                    <label>
                        <span>Bid</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={bid}
                            onChange={(e) => setBid(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                            disabled={busy}
                            autoFocus
                        />
                    </label>
                    <label>
                        <span>Ask</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={ask}
                            onChange={(e) => setAsk(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                            disabled={busy}
                        />
                    </label>
                    <div className="dd-width">
                        <span>Width</span>
                        <strong>{parsed ? money(parsed.ask - parsed.bid) : "—"}</strong>
                    </div>
                    <button
                        type="button"
                        className="mtm-btn mtm-btn--primary"
                        onClick={submit}
                        disabled={busy || !parsed}
                    >
                        {busy ? "Working…" : "Show market"}
                    </button>
                </div>
                {!parsed && (bid !== "" || ask !== "") && (
                    <p className="dd-prose dd-prose--warn">
                        Your ask must be at least 1 above your bid.
                    </p>
                )}
            </div>
        </div>
    );
}
