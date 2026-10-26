import { describeReveal } from "./contracts";
import { contractPnl, momentsAt, type ContractState } from "./engine";
import { contractsFor, DD_PRESETS, type DdPreset } from "./presets";
import { score, type DdBreakdown } from "./scoring";
import { DD_STAGES, type Quote, type Stage } from "./types";
import type { RunState } from "./replay";

// Redaction layer.
//
// The engine state holds the realised process and the true fair -- i.e. the
// answer. None of it may reach the browser before settlement, or the game is
// just a typing exercise. Everything the client receives is built here, by
// naming fields explicitly rather than deleting them from the engine state,
// so a new field added to ContractState is invisible by default instead of
// leaking by default.
//
// ONE DELIBERATE EXCEPTION: the player sees their own fills, including which
// way each counterparty went and at what price. That IS information -- three
// lifts of your offer says the market thinks you are too low -- and reading
// it is part of the exercise. What is withheld in flight is whether a given
// counterparty was informed, which would turn inference into a lookup.

export interface PublicFill {
    stage: Stage;
    counterparty: "buy" | "sell";
    price: number;
}

export interface PublicContract {
    id: string;
    description: string;
    index: number;
    total: number;
    stage: Stage;
    /** Only present once the reveal has happened. */
    revealText: string | null;
    quotes: (Quote | null)[];
    fills: PublicFill[];
    inventory: number;
    cash: number;
    secondsPerQuote: number;
}

export interface PublicRun {
    preset: DdPreset;
    presetLabel: string;
    complete: boolean;
    contract: PublicContract | null;
    /** Settled contracts, oldest first. Populated only once complete. */
    results: SettledContract[] | null;
    breakdown: DdBreakdown | null;
}

export interface SettledContract {
    id: string;
    description: string;
    lesson: string;
    settlement: number;
    pnl: number;
    stages: { stage: Stage; fair: number; sd: number; quote: Quote | null }[];
    revealText: string;
    inventory: number;
    informedFills: number;
    uninformedFills: number;
}

function publicFills(state: ContractState): PublicFill[] {
    return state.fills.map((fill) => ({
        stage: fill.stage,
        counterparty: fill.counterparty,
        price: fill.price,
    }));
}

function projectContract(
    state: ContractState,
    index: number,
    total: number,
    secondsPerQuote: number
): PublicContract {
    return {
        id: state.contract.id,
        description: state.contract.description,
        index,
        total,
        stage: state.stage,
        revealText: state.stage >= 1 ? describeReveal(state.contract, state.realisation) : null,
        quotes: state.quotes,
        fills: publicFills(state),
        inventory: state.inventory,
        cash: state.cash,
        secondsPerQuote,
    };
}

function projectSettled(state: ContractState): SettledContract {
    const stages = [];
    for (let s = 0; s < DD_STAGES; s++) {
        const { fair, sd } = momentsAt(state, s as Stage);
        stages.push({ stage: s as Stage, fair, sd, quote: state.quotes[s] ?? null });
    }
    return {
        id: state.contract.id,
        description: state.contract.description,
        lesson: state.contract.lesson,
        settlement: state.realisation.settlement,
        pnl: contractPnl(state),
        stages,
        revealText: describeReveal(state.contract, state.realisation),
        inventory: state.inventory,
        informedFills: state.fills.filter((f) => f.informed).length,
        uninformedFills: state.fills.filter((f) => !f.informed).length,
    };
}

export function projectRun(run: RunState): PublicRun {
    const info = DD_PRESETS[run.preset];
    const total = contractsFor().length;
    const live = run.complete ? null : run.contracts[run.contracts.length - 1];

    return {
        preset: run.preset,
        presetLabel: info.label,
        complete: run.complete,
        contract: live
            ? projectContract(live, run.contracts.length - 1, total, info.config.secondsPerQuote)
            : null,
        // Nothing is given away until the whole run is over: a settled
        // contract's true fair would otherwise hint at the next one.
        results: run.complete ? run.contracts.map(projectSettled) : null,
        breakdown: run.complete ? score(run) : null,
    };
}
