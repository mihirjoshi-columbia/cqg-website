import { MAKER_COUNT, TOTAL_ROUNDS } from "./deck";
import { advance, pass, roundComplete, startGame, trade, type GameState } from "./engine";
import { mulberry32 } from "./prng";
import { configFor, type MtmPreset } from "./presets";

export type MtmAction = "buy" | "sell" | "pass";

/** 5 rounds x 4 makers. A hand is complete when this many decisions exist. */
export const MTM_TOTAL_ACTIONS = TOTAL_ROUNDS * MAKER_COUNT;

export function isMtmAction(value: unknown): value is MtmAction {
    return value === "buy" || value === "sell" || value === "pass";
}

export function parseActions(raw: readonly unknown[]): MtmAction[] {
    return raw.map((entry) => {
        if (!isMtmAction(entry)) throw new Error("corrupt action list");
        return entry;
    });
}

export interface ReplayOptions {
    /**
     * Apply the community-card flip for a round that is already fully
     * answered.
     *
     * Advance is LAZY by default: it runs only when a later action needs the
     * next round to exist, or when the hand is complete and must settle. So a
     * replay of exactly four actions returns the state the player is looking
     * at *before* the flip, with their fourth fill visible -- which is what
     * the "Flip community card" beat needs. The flip endpoint replays the
     * same actions with this flag set. Nothing extra is carried either way,
     * because the flip is always derivable from the action count.
     */
    advanceCompletedRound?: boolean;
}

/**
 * Rebuilds a hand from scratch: (seed, preset, ordered decisions) -> GameState.
 *
 * This is the only place a hand is ever evaluated. The server carries nothing
 * but the seed and the decision list (encrypted into the session token) and
 * replays from zero on every request, so there is no session state to store
 * or expire.
 *
 * Determinism rests on a property of the engine worth stating explicitly:
 * quoteMarkets draws exactly one random() per maker at index >= startIndex
 * and nothing for makers that already have a quote, so the NUMBER of draws
 * consumed is the same whether the player buys, sells or passes. Only the
 * position in the sequence matters, never the choice. That is what lets the
 * server reproduce the exact quotes the player saw.
 */
export function replay(
    seed: number,
    preset: MtmPreset,
    actions: readonly MtmAction[],
    options: ReplayOptions = {}
): GameState {
    if (actions.length > MTM_TOTAL_ACTIONS) {
        throw new Error(`too many actions: ${actions.length} > ${MTM_TOTAL_ACTIONS}`);
    }

    // One generator per replay, consumed in strict order. See prng.ts.
    const random = mulberry32(seed);
    let state = startGame(configFor(preset), random);

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i]!;
        const makerIndex = state.activeMaker;
        state =
            action === "pass"
                ? pass(state, makerIndex, random)
                : trade(state, makerIndex, action, random);

        // Only flip early if a further decision needs the next round to
        // exist. The last completed round is handled below.
        if (roundComplete(state) && i < actions.length - 1) {
            state = advance(state, random);
        }
    }

    const complete = actions.length === MTM_TOTAL_ACTIONS;
    if (roundComplete(state) && (complete || options.advanceCompletedRound)) {
        state = advance(state, random);
    }

    return state;
}
