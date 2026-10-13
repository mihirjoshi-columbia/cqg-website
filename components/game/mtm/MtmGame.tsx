"use client";

import { useCallback, useState } from "react";
import type { MtmPreset } from "@/lib/game/mtm/presets";
import type { MtmPublicState, MtmSettledState } from "@/lib/game/mtm/project";
import type { Side } from "@/lib/game/mtm/types";
import Setup from "./Setup";
import Playing from "./Playing";
import Done from "./Done";

// ===========================================================================
// The game shell.
//
// This component holds no game logic: the engine runs on the server, which
// owns the deal and computes the score. It renders whatever redacted state
// the server last returned and posts the player's decisions back, carrying an
// opaque session token it cannot read or forge. It never sees a hidden card
// and never computes a P&L -- which is what makes the emailed score mean
// something.
// ===========================================================================

type Phase =
    | { kind: "setup" }
    | { kind: "playing"; state: MtmPublicState }
    | { kind: "done"; state: MtmSettledState };

function isSettled(state: MtmPublicState | MtmSettledState): state is MtmSettledState {
    return state.phase === "done" && "finalPnl" in state;
}

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

type StepResponse = { state: MtmPublicState | MtmSettledState; token: string };

export default function MtmGame({ initialPreset = "training" }: { initialPreset?: MtmPreset }) {
    const [preset, setPreset] = useState<MtmPreset>(initialPreset);
    const [phase, setPhase] = useState<Phase>({ kind: "setup" });
    const [token, setToken] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apply = useCallback(({ state, token: next }: StepResponse) => {
        setToken(next);
        setPhase(isSettled(state) ? { kind: "done", state } : { kind: "playing", state });
    }, []);

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

    const current = phase.kind === "playing" ? phase.state : null;

    // The next action index is simply how many decisions exist: four per
    // completed round, plus however many of this round are answered. The
    // server rejects anything else, which is what stops a double-clicked Buy
    // from filling twice.
    const actionIndex = current
        ? current.round * current.roundActions.length +
          current.roundActions.filter((a) => a !== null).length
        : 0;

    const start = () =>
        guard(async () => {
            apply(await post<StepResponse>("/api/game/mtm/start", { preset }));
        });

    const act = (index: number, action: "buy" | "sell" | "pass") =>
        guard(async () => {
            apply(await post<StepResponse>("/api/game/mtm/action", { token, index, action }));
        });

    const advance = () =>
        guard(async () => {
            apply(await post<StepResponse>("/api/game/mtm/advance", { token }));
        });

    const reset = () => {
        setToken(null);
        setError(null);
        setPhase({ kind: "setup" });
    };

    return (
        <div className="mtm-root">
            <header className="mtm-masthead">
                <div>
                    <p className="mtm-eyebrow">
                        {phase.kind === "playing"
                            ? `Market making / Round ${phase.state.round + 1} of ${phase.state.totalRounds}`
                            : phase.kind === "done"
                              ? "Market making / Settled"
                              : "Market making / Internal homework"}
                    </p>
                    <h1 className="mtm-h1">Make the Market</h1>
                </div>
                {phase.kind !== "setup" && (
                    <button type="button" className="mtm-link" onClick={reset}>
                        Quit to setup
                    </button>
                )}
            </header>

            {error && <div className="mtm-notice mtm-notice--error">{error}</div>}

            {phase.kind === "setup" && (
                <Setup
                    preset={preset}
                    onPresetChange={setPreset}
                    onStart={start}
                    busy={busy}
                />
            )}

            {phase.kind === "playing" && (
                <Playing
                    state={phase.state}
                    busy={busy}
                    onTrade={(_makerIndex: number, side: Side) => act(actionIndex, side)}
                    onPass={() => act(actionIndex, "pass")}
                    onAdvance={advance}
                />
            )}

            {phase.kind === "done" && (
                <Done state={phase.state} token={token} onReset={reset} />
            )}
        </div>
    );
}
