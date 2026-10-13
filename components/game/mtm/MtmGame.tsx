"use client";

import { useState } from "react";
import { initialState, startGame, trade, pass, advance, type GameState } from "@/lib/game/mtm/engine";
import { configFor, type MtmPreset } from "@/lib/game/mtm/presets";
import type { Side } from "@/lib/game/mtm/types";
import Setup from "./Setup";
import Playing from "./Playing";
import Done from "./Done";

// The game runs entirely in the browser: the engine is a set of pure
// functions over a GameState held here, exactly as in the standalone version.
// Nothing is persisted, so a reload starts over.
export default function MtmGame({ initialPreset = "training" }: { initialPreset?: MtmPreset }) {
    const [preset, setPreset] = useState<MtmPreset>(initialPreset);
    const [state, setState] = useState<GameState>(() => initialState(configFor(initialPreset)));

    const reset = () => setState(initialState(configFor(preset)));

    return (
        <div className="mtm-root">
            <header className="mtm-masthead">
                <div>
                    <p className="mtm-eyebrow">
                        {state.phase === "playing"
                            ? `Market making / Round ${state.round + 1} of 5`
                            : state.phase === "done"
                              ? "Market making / Settled"
                              : "Market making / Internal homework"}
                    </p>
                    <h1 className="mtm-h1">Make the Market</h1>
                </div>
                {state.phase !== "setup" && (
                    <button type="button" className="mtm-link" onClick={reset}>
                        Quit to setup
                    </button>
                )}
            </header>

            {state.phase === "setup" && (
                <Setup
                    preset={preset}
                    onPresetChange={setPreset}
                    onStart={() => setState(startGame(configFor(preset)))}
                />
            )}

            {state.phase === "playing" && (
                <Playing
                    state={state}
                    onTrade={(i: number, side: Side) => setState((s) => trade(s, i, side))}
                    onPass={(i: number) => setState((s) => pass(s, i))}
                    onAdvance={() => setState((s) => advance(s))}
                />
            )}

            {state.phase === "done" && (
                <Done state={state} preset={preset} onReset={reset} />
            )}
        </div>
    );
}
