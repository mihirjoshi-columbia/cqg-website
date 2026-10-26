"use client";

import { useCallback, useState } from "react";
import type { PublicRun } from "@/lib/game/dd/project";
import Setup from "./Setup";
import Quoting from "./Quoting";
import Done from "./Done";

// ===========================================================================
// The game shell.
//
// Holds no game logic. The engine runs on the server, which owns the deal and
// computes the score; this renders whatever redacted state the server last
// returned and posts quotes back, carrying an opaque session token it cannot
// read or forge. It never sees an unrevealed outcome and never computes a
// P&L, which is what makes a contest result mean something.
//
// Markup reuses the .mtm-* design system rather than cloning ~300 lines of
// CSS for a second trading-desk surface; .dd-root carries only what is
// genuinely new here (quote entry, the clock, the sub-score bars).
// ===========================================================================

async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error ?? "Something went wrong.");
    return payload as T;
}

type StepResponse = { run: PublicRun; token: string; lateQuote?: boolean };

export interface DdGameProps {
    /** The contest this run is graded against. Every run has one. */
    contestSlug: string;
    contestLabel: string;
    attemptsUsed: number;
    attemptsAllowed: number;
    /** Best completed score so far, or null if none finished. */
    bestScore: number | null;
    /** No attempts left, or the window is shut. */
    locked?: boolean;
    lockedReason?: string;
}

export default function DdGame({
    contestSlug,
    contestLabel,
    attemptsUsed,
    attemptsAllowed,
    bestScore,
    locked,
    lockedReason,
}: DdGameProps) {
    const [run, setRun] = useState<PublicRun | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lateNotice, setLateNotice] = useState(false);

    const guard = useCallback(async (fn: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setBusy(false);
        }
    }, []);

    const apply = useCallback((response: StepResponse) => {
        setToken(response.token);
        setRun(response.run);
        setLateNotice(Boolean(response.lateQuote));
    }, []);

    const start = () =>
        guard(async () => {
            apply(await post<StepResponse>("/api/game/dd/start", { contestSlug }));
        });

    // The next quote index is simply how many quotes already exist: two per
    // settled contract, plus however many of the live one are answered. The
    // server rejects anything else, so a double-clicked Submit cannot count
    // as the next stage's market.
    const quoteIndex = run?.contract
        ? run.contract.index * 2 + run.contract.quotes.filter((q) => q !== null).length
        : 0;

    const submitQuote = (bid: number, ask: number) =>
        guard(async () => {
            apply(
                await post<StepResponse>("/api/game/dd/quote", {
                    token,
                    index: quoteIndex,
                    bid,
                    ask,
                })
            );
        });

    return (
        <div className="mtm-root dd-root">
            <header className="mtm-masthead">
                <div>
                    <p className="mtm-eyebrow">
                        {run?.contract
                            ? `${run.presetLabel} / Contract ${run.contract.index + 1} of ${run.contract.total}`
                            : run?.complete
                              ? `${run.presetLabel} / Settled`
                              : contestLabel}
                    </p>
                    <h1 className="mtm-h1">Distribution Desk</h1>
                </div>
            </header>

            {error && <div className="mtm-notice mtm-notice--error">{error}</div>}
            {lateNotice && (
                <div className="mtm-notice mtm-notice--error">
                    That quote missed the clock, so it was recorded as a market so wide that
                    nothing traded on it. The contract is gone, the run is not.
                </div>
            )}

            {!run &&
                (locked ? (
                    <div className="mtm-panel">
                        <p className="mtm-panel__label">Attempt used</p>
                        <p className="dd-prose">{lockedReason}</p>
                    </div>
                ) : (
                    <Setup
                        onStart={start}
                        busy={busy}
                        attemptsUsed={attemptsUsed}
                        attemptsAllowed={attemptsAllowed}
                        bestScore={bestScore}
                    />
                ))}

            {run?.contract && (
                <Quoting
                    // Remounting per stage clears the quote inputs without an
                    // effect that calls setState.
                    key={`${run.contract.id}-${run.contract.stage}`}
                    contract={run.contract}
                    busy={busy}
                    onSubmit={submitQuote}
                />
            )}

            {run?.complete && (
                <Done run={run} attemptsLeft={Math.max(0, attemptsAllowed - attemptsUsed - 1)} />
            )}
        </div>
    );
}
