import { mulberry32 } from "../prng";
import { applyQuote, openContract, type ContractState } from "./engine";
import { contractsFor, configFor, type DdPreset } from "./presets";
import { DD_STAGES, type Quote } from "./types";

/**
 * Rebuilds a run from scratch: (seeds, preset, ordered quotes) -> state.
 *
 * This is the only place a run is ever evaluated. The server carries nothing
 * but the seeds and the quote list (encrypted into the session token) and
 * replays from zero on every request, so there is no session state to store.
 *
 * Each contract gets its OWN generator seeded from its own entry in the seed
 * set. That keeps contracts independent -- a contest can curate one contract's
 * deal without disturbing any other -- and makes the determinism argument
 * local: openContract draws everything up front, nothing else draws at all.
 */
export interface RunState {
    preset: DdPreset;
    contracts: ContractState[];
    /** Index of the contract being quoted, or contracts.length when finished. */
    current: number;
    complete: boolean;
}

export function totalQuotesFor(preset: DdPreset): number {
    return contractsFor(preset).length * DD_STAGES;
}

export function replay(seeds: readonly number[], preset: DdPreset, quotes: readonly Quote[]): RunState {
    const library = contractsFor(preset);
    const config = configFor(preset);

    if (quotes.length > library.length * DD_STAGES) {
        throw new Error(`too many quotes: ${quotes.length} > ${library.length * DD_STAGES}`);
    }

    const states: ContractState[] = [];
    for (let i = 0; i < library.length; i++) {
        const seed = seeds[i];
        if (seed === undefined) throw new Error(`seed set is missing an entry for contract ${i}`);

        let state = openContract(library[i]!, config, mulberry32(seed));

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
        contracts: states,
        current: complete ? library.length : states.length - 1,
        complete,
    };
}
