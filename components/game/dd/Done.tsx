"use client";

import type { PublicRun } from "@/lib/game/dd/project";
import type { Verdict } from "@/lib/game/dd/scoring";

function money(value: number): string {
    return value.toFixed(2);
}

const VERDICT_LABEL: Record<Verdict, string> = {
    correct: "Correct",
    close: "Slightly wrong",
    off: "Very wrong",
};

function Judgement({ verdict }: { verdict: Verdict | null }) {
    if (verdict === null) {
        // No uncertainty was left in the contract, so there was no right width
        // to compare against. Saying nothing is honest; "correct" would not be.
        return <span className="dd-verdict dd-verdict--none">Not graded</span>;
    }
    return (
        <span className={`dd-verdict dd-verdict--${verdict}`}>{VERDICT_LABEL[verdict]}</span>
    );
}

/**
 * The results screen shows VERDICTS, not answers.
 *
 * It used to print each contract's true fair value, true standard deviation
 * and settlement, plus a written explanation of the intended reasoning. That
 * made sense when a run was a one-shot graded deal. It does not now: anybody
 * can play as often as they like, so handing over the worked answer would
 * turn the next run into transcription. The four dimensions below still say
 * WHICH idea went wrong -- a player can lose money by mispricing, by
 * mis-sizing the spread, by misreading a reveal, or by carrying risk they did
 * not need -- without saying what the right number was.
 */
const DIMENSIONS: { key: "pricing" | "width" | "reveal" | "risk"; label: string; hint: string }[] = [
    { key: "pricing", label: "Pricing", hint: "Your mid against the contract's true fair value." },
    { key: "width", label: "Width", hint: "Your spread against the contract's true standard deviation." },
    { key: "reveal", label: "Reading information", hint: "Whether each re-quote moved, and resized, the way the reveal implied." },
    { key: "risk", label: "Risk control", hint: "How much inventory you carried into settlement." },
];

export default function Done({ run }: { run: PublicRun }) {
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
                    Total P&amp;L across {results.length} contracts. Largest position carried into a
                    settlement: {breakdown.maxInventory}.
                </p>
                <p className="dd-prose">
                    Score <strong>{breakdown.scaledPnl.toFixed(2)}</strong> &mdash; your P&amp;L
                    measured against how much risk this particular deal carried. Deals differ
                    from run to run, so this is the number the leaderboard averages, not the cash.
                </p>
                <p className="dd-prose dd-prose--note">
                    Every answer is graded against the contract&apos;s true fair value and true
                    standard deviation. <strong>Correct means within 5%.</strong> The numbers
                    themselves stay hidden &mdash; you get the verdict, not the worked answer, so
                    the arithmetic is still yours to do next time.
                </p>
                <p className="dd-prose">
                    Attempts are unlimited and every run is dealt a different set of contracts.{" "}
                    <a href="." className="mtm-link">
                        Reload to play again
                    </a>
                    .
                </p>
            </div>

            <div className="mtm-panel">
                <p className="mtm-panel__label">How you did</p>
                <div className="dd-bars">
                    {DIMENSIONS.map(({ key, label, hint }) => (
                        <div className="dd-bar" key={key}>
                            <div className="dd-bar__head">
                                <span>{label}</span>
                                <Judgement verdict={breakdown[key]} />
                            </div>
                            <p className="dd-bar__hint">{hint}</p>
                        </div>
                    ))}
                </div>
            </div>

            {results.map((result, i) => (
                <div className="mtm-panel" key={result.id}>
                    <p className="mtm-panel__label">
                        Contract {i + 1} &middot;{" "}
                        <span className={result.pnl >= 0 ? "dd-pos" : "dd-neg"}>
                            {money(result.pnl)}
                        </span>
                    </p>
                    <p className="dd-prose">{result.description}</p>

                    <table className="dd-table">
                        <thead>
                            <tr>
                                <th>Stage</th>
                                <th>Your price</th>
                                <th>Your width</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.stages.map((stage) => (
                                <tr key={stage.stage}>
                                    <td>{stage.stage === 0 ? "Opening" : "After reveal"}</td>
                                    <td>
                                        <Judgement verdict={stage.price} />
                                    </td>
                                    <td>
                                        <Judgement verdict={stage.width} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p className="dd-prose">
                        <span className="dd-chip">Reveal</span> {result.revealText}
                    </p>
                    <p className="dd-prose">
                        Traded against {result.informedFills} informed and{" "}
                        {result.uninformedFills} uninformed counterparties; carried{" "}
                        {result.inventory} into settlement.
                    </p>
                </div>
            ))}
        </div>
    );
}
