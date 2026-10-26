"use client";

import type { PublicRun } from "@/lib/game/dd/project";

function money(value: number): string {
    return value.toFixed(2);
}

/**
 * The sub-scores are the point of the results screen.
 *
 * A single P&L cannot tell a student whether they lost money by mispricing,
 * by mis-sizing the spread, by misreading a reveal, or by carrying risk they
 * did not need. These four separate exactly those causes, so a weak run is
 * diagnosable instead of merely disappointing.
 */
const SUBSCORES: { key: "pricing" | "widthCalibration" | "revealResponse" | "riskControl"; label: string; hint: string }[] = [
    { key: "pricing", label: "Pricing", hint: "How close your mid sat to the true fair value." },
    { key: "widthCalibration", label: "Width", hint: "How close your spread sat to one standard deviation." },
    { key: "revealResponse", label: "Reading information", hint: "Whether each re-quote moved, and resized, the way the reveal implied." },
    { key: "riskControl", label: "Risk control", hint: "How much inventory you carried into settlement." },
];

export default function Done({ run, onReset }: { run: PublicRun; onReset: (() => void) | null }) {
    const breakdown = run.breakdown;
    const results = run.results;
    if (!breakdown || !results) return null;

    return (
        <div className="mtm-stack">
            <div className="mtm-panel">
                <p className="mtm-panel__label">Result</p>
                <p className="dd-total">
                    <span className={breakdown.totalPnl >= 0 ? "dd-pos" : "dd-neg"}>
                        {money(breakdown.totalPnl)}
                    </span>
                </p>
                <p className="dd-prose">
                    Total P&amp;L across {results.length} contracts. Spread of P&amp;L between
                    contracts: {money(breakdown.pnlSd)}. Largest position carried into a
                    settlement: {breakdown.maxInventory}.
                </p>
            </div>

            <div className="mtm-panel">
                <p className="mtm-panel__label">Where it came from</p>
                <div className="dd-bars">
                    {SUBSCORES.map(({ key, label, hint }) => {
                        const value = breakdown[key];
                        return (
                            <div className="dd-bar" key={key}>
                                <div className="dd-bar__head">
                                    <span>{label}</span>
                                    <strong>{Math.round(value * 100)}%</strong>
                                </div>
                                <div className="dd-bar__track">
                                    <div
                                        className="dd-bar__fill"
                                        style={{ width: `${Math.round(value * 100)}%` }}
                                    />
                                </div>
                                <p className="dd-bar__hint">{hint}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {results.map((result, i) => {
                const detail = breakdown.contracts[i];
                return (
                    <div className="mtm-panel" key={result.id}>
                        <p className="mtm-panel__label">
                            Contract {i + 1} &middot; settled at {money(result.settlement)} &middot;{" "}
                            <span className={result.pnl >= 0 ? "dd-pos" : "dd-neg"}>
                                {money(result.pnl)}
                            </span>
                        </p>
                        <p className="dd-prose">{result.description}</p>

                        <table className="dd-table">
                            <thead>
                                <tr>
                                    <th>Stage</th>
                                    <th>True fair</th>
                                    <th>True SD</th>
                                    <th>Your market</th>
                                    <th>Your width</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.stages.map((stage) => (
                                    <tr key={stage.stage}>
                                        <td>{stage.stage === 0 ? "Opening" : "After reveal"}</td>
                                        <td>{money(stage.fair)}</td>
                                        <td>{money(stage.sd)}</td>
                                        <td>
                                            {stage.quote
                                                ? `${money(stage.quote.bid)} / ${money(stage.quote.ask)}`
                                                : "—"}
                                        </td>
                                        <td>
                                            {stage.quote
                                                ? money(stage.quote.ask - stage.quote.bid)
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <p className="dd-prose">
                            <span className="dd-chip">Reveal</span> {result.revealText}
                        </p>
                        {detail && (
                            <p className="dd-prose">
                                Traded against {detail.informedFills} informed and{" "}
                                {detail.uninformedFills} uninformed counterparties; carried{" "}
                                {detail.finalInventory} into settlement.
                            </p>
                        )}
                        <p className="dd-prose dd-prose--lesson">{result.lesson}</p>
                    </div>
                );
            })}

            {onReset && (
                <button type="button" className="mtm-btn mtm-btn--primary dd-start" onClick={onReset}>
                    Deal another practice run
                </button>
            )}
        </div>
    );
}
