import { mulberry32 } from "../prng";
import { makeDeal, DD_CONTRACT_COUNT } from "./deal";
import { applyQuote, openContract, type ContractState } from "./engine";
import { configFor, type DdPreset } from "./presets";
import { DD_STAGES, type Quote } from "./types";

/**
 * Rebuilds a run from scratch: (deal seed, preset, ordered quotes) -> state.
 *
 * This is the only place a run is ever evaluated. The server carries nothing
 * but the deal seed and the quote list (encrypted into the session token) and
 * replays from zero on every request, so there is no session state to store.
 *
 * The deal seed generates both the contracts and their realisation seeds
 * (lib/game/dd/deal.ts). Each contract then gets its OWN generator from its
 * own seed, which keeps contracts independent and makes the determinism
 * argument local: openContract draws everything up front, nothing else draws
 * at all.
 */
export interface RunState {
    preset: DdPreset;
    dealSeed: number;
    contracts: ContractState[];
    /** Contracts in the whole run, settled or not. */
    total: number;
    /** Index of the contract being quoted, or `total` when finished. */
    current: number;
    complete: boolean;
}

export function replay(dealSeed: number, preset: DdPreset, quotes: readonly Quote[]): RunState {
    const { contracts: library, seeds } = makeDeal(dealSeed);
    const config = configFor(preset);

    if (quotes.length > library.length * DD_STAGES) {
        throw new Error(`too many quotes: ${quotes.length} > ${library.length * DD_STAGES}`);
    }

    const states: ContractState[] = [];
    for (let i = 0; i < library.length; i++) {
        let state = openContract(library[i]!, config, mulberry32(seeds[i]!));

        for (let stage = 0; stage < DD_STAGES; stage++) {
            const quote = quotes[i * DD_STAGES + stage];
            if (quote === undefined) break;
            state = applyQuote(state, quote, config);
        }

        states.push(state);
        if (!state.settled) break;
    }

    const complete = quotes.length === library.length * DD_STAGES;
    return {
        preset,
        dealSeed,
        contracts: states,
        total: DD_CONTRACT_COUNT,
        current: complete ? library.length : states.length - 1,
        complete,
    };
}
