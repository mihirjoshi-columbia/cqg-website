import { describeReveal } from "./contracts";
import { contractPnl, type ContractState } from "./engine";
import { DD_PRESETS, type DdPreset } from "./presets";
import { score, type DdBreakdown, type Verdict } from "./scoring";
import { DD_STAGES, type Quote, type Stage } from "./types";
import type { RunState } from "./replay";

// Redaction layer.
//
// The engine state holds the realised process and the true fair -- i.e. the
// answer. None of it may reach the browser, or the game is just a typing
// exercise. Everything the client receives is built here, by naming fields
// explicitly rather than deleting them from the engine state, so a new field
// added to ContractState is invisible by default instead of leaking by
// default.
//
// NOTHING IS REVEALED AT SETTLEMENT EITHER. The results screen used to print
// each contract's true fair, true SD and settlement value, which handed over
// the worked answer the moment a run finished -- fine when a run was a
// one-shot graded deal, wrong now that anyone can replay as often as they
// like and that the point is to practise the arithmetic. A player gets their
// P&L and a verdict per answer (see scoring.ts): correct within 5%, slightly
// off, or wrong. The exact numbers stay server-side on the attempt row.
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

/** A verdict on one stage's market. No fair value, no SD, no settlement. */
export interface PublicStageVerdict {
    stage: Stage;
    /** Was the mid within 5% of the true fair? */
    price: Verdict;
    /** Was the width within 5% of the true SD? Null when there was no risk left. */
    width: Verdict | null;
}

export interface PublicSettledContract {
    id: string;
    description: string;
    revealText: string;
    pnl: number;
    inventory: number;
    informedFills: number;
    uninformedFills: number;
    stages: PublicStageVerdict[];
}

/** The run-level report. Verdicts, P&L and the ranked score only. */
export interface PublicBreakdown {
    totalPnl: number;
    /** What the leaderboard averages. See scoring.ts. */
    scaledPnl: number;
    maxInventory: number;
    pricing: Verdict;
    width: Verdict;
    reveal: Verdict;
    risk: Verdict;
}

export interface PublicRun {
    preset: DdPreset;
    presetLabel: string;
    complete: boolean;
    contract: PublicContract | null;
    /** Settled contracts, oldest first. Populated only once complete. */
    results: PublicSettledContract[] | null;
    breakdown: PublicBreakdown | null;
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

function projectSettled(state: ContractState, breakdown: DdBreakdown): PublicSettledContract {
    // The breakdown already holds the graded stages, so the verdicts are read
    // from there rather than recomputed: one definition of "correct", used by
    // both the stored record and the screen.
    const detail = breakdown.contracts.find((c) => c.contractId === state.contract.id);
    const stages: PublicStageVerdict[] = [];
    for (let s = 0; s < DD_STAGES; s++) {
        const graded = detail?.stages.find((stage) => stage.stage === s);
        if (!graded) continue;
        stages.push({
            stage: graded.stage,
            price: graded.priceVerdict,
            width: graded.widthVerdict,
        });
    }

    return {
        id: state.contract.id,
        description: state.contract.description,
        revealText: describeReveal(state.contract, state.realisation),
        pnl: contractPnl(state),
        inventory: state.inventory,
        informedFills: state.fills.filter((f) => f.informed).length,
        uninformedFills: state.fills.filter((f) => !f.informed).length,
        stages,
    };
}

function projectBreakdown(breakdown: DdBreakdown): PublicBreakdown {
    return {
        totalPnl: breakdown.totalPnl,
        scaledPnl: breakdown.scaledPnl,
        maxInventory: breakdown.maxInventory,
        pricing: breakdown.verdicts.pricing,
        width: breakdown.verdicts.width,
        reveal: breakdown.verdicts.reveal,
        risk: breakdown.verdicts.risk,
    };
}

export function projectRun(run: RunState): PublicRun {
    const info = DD_PRESETS[run.preset];
    const live = run.complete ? null : run.contracts[run.contracts.length - 1];
    const breakdown = run.complete ? score(run) : null;

    return {
        preset: run.preset,
        presetLabel: info.label,
        complete: run.complete,
        contract: live
            ? projectContract(
                  live,
                  run.contracts.length - 1,
                  run.total,
                  info.config.secondsPerQuote
              )
            : null,
        results:
            run.complete && breakdown
                ? run.contracts.map((state) => projectSettled(state, breakdown))
                : null,
        breakdown: breakdown ? projectBreakdown(breakdown) : null,
    };
}
