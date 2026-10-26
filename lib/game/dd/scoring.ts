import { contractPnl, momentsAt, type ContractState } from "./engine";
import { configFor, type DdPreset } from "./presets";
import { DD_STAGES, type Stage } from "./types";
import type { RunState } from "./replay";

// Scoring has two jobs that pull in different directions.
//
// The LEADERBOARD needs one number everybody understands, so the rank is
// total P&L and nothing else.
//
// The EVALUATION needs to say which idea a student is missing, which a single
// P&L cannot: a player can lose money from mispricing, from mis-sizing the
// spread, from misreading a reveal, or from carrying risk they did not need.
// The sub-scores below separate those four, so a weak run is diagnosable.
//
// Sub-scores are all 0..1 and are reported, never summed into the rank.

export interface StageDetail {
    stage: Stage;
    fair: number;
    sd: number;
    mid: number;
    width: number;
    /** Distance from fair, in SDs. Lower is better. */
    pricingError: number;
    /** Quoted width as a multiple of the SD. The flow model rewards ~1. */
    widthRatio: number | null;
}

export interface ContractDetail {
    contractId: string;
    pnl: number;
    settlement: number;
    finalInventory: number;
    informedFills: number;
    uninformedFills: number;
    stages: StageDetail[];
    /** 0..1: did the re-quote respond to the reveal correctly? */
    revealScore: number | null;
}

export interface DdBreakdown {
    totalPnl: number;
    contracts: ContractDetail[];
    /** 0..1, mean over stages of exp(-|mid - fair| / sd). */
    pricing: number;
    /** 0..1, how close quoted width was to one SD, measured in log space. */
    widthCalibration: number;
    /** 0..1, correctness of the response to each reveal. */
    revealResponse: number;
    /** 0..1, discipline about inventory carried into settlement. */
    riskControl: number;
    /** Spread of P&L across contracts. Reported as a stat, not scored. */
    pnlSd: number;
    maxInventory: number;
}

/** Scale to measure an absolute price error against when the SD is ~0. */
function errorScale(sd: number, priorSd: number): number {
    return Math.max(sd, 0.05 * priorSd, 1);
}

function stageDetail(state: ContractState, stage: Stage, priorSd: number): StageDetail | null {
    const quote = state.quotes[stage];
    if (!quote) return null;

    const { fair, sd } = momentsAt(state, stage);
    const mid = (quote.bid + quote.ask) / 2;
    const width = quote.ask - quote.bid;

    return {
        stage,
        fair,
        sd,
        mid,
        width,
        pricingError: Math.abs(mid - fair) / errorScale(sd, priorSd),
        // With no uncertainty left there is no "right" width to compare to.
        widthRatio: sd > 0 ? width / sd : null,
    };
}

/**
 * Did the re-quote respond to the reveal correctly?
 *
 * Two halves, equally weighted:
 *  - direction: did the mid move by roughly what the reveal implied?
 *  - width: did the width change by roughly the ratio the SDs changed by?
 *
 * The width half is the one that catches the geometric contracts. There the
 * SD ratio is exactly 1, so a player who tightens "because information
 * arrived" is marked down -- memorylessness repriced the contract without
 * removing any risk.
 */
function revealScore(stages: StageDetail[]): number | null {
    const [before, after] = stages;
    if (!before || !after) return null;

    const impliedMove = after.fair - before.fair;
    const playerMove = after.mid - before.mid;
    const scale = Math.max(before.sd, 1);
    const direction = Math.exp(-Math.abs(playerMove - impliedMove) / scale);

    let width = direction;
    if (before.sd > 0 && after.sd > 0 && before.width > 0 && after.width > 0) {
        const expectedRatio = after.sd / before.sd;
        const playerRatio = after.width / before.width;
        // Compared in log space so halving and doubling are penalised equally.
        width = Math.exp(-Math.abs(Math.log(playerRatio / expectedRatio)));
    }

    return (direction + width) / 2;
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function score(run: RunState): DdBreakdown {
    const { positionLimit } = configFor(run.preset as DdPreset);

    const contracts: ContractDetail[] = run.contracts
        .filter((state) => state.settled)
        .map((state) => {
            const priorSd = momentsAt(state, 0).sd;
            const stages: StageDetail[] = [];
            for (let s = 0; s < DD_STAGES; s++) {
                const detail = stageDetail(state, s as Stage, priorSd);
                if (detail) stages.push(detail);
            }
            return {
                contractId: state.contract.id,
                pnl: contractPnl(state),
                settlement: state.realisation.settlement,
                finalInventory: state.inventory,
                informedFills: state.fills.filter((f) => f.informed).length,
                uninformedFills: state.fills.filter((f) => !f.informed).length,
                stages,
                revealScore: revealScore(stages),
            };
        });

    const allStages = contracts.flatMap((c) => c.stages);
    const pnls = contracts.map((c) => c.pnl);
    const totalPnl = pnls.reduce((sum, p) => sum + p, 0);
    const avgPnl = pnls.length ? totalPnl / pnls.length : 0;

    return {
        totalPnl,
        contracts,
        pricing: mean(allStages.map((s) => Math.exp(-s.pricingError))),
        widthCalibration: mean(
            allStages
                .filter((s): s is StageDetail & { widthRatio: number } => s.widthRatio !== null)
                .map((s) => Math.exp(-Math.abs(Math.log(Math.max(s.widthRatio, 1e-6)))))
        ),
        revealResponse: mean(
            contracts
                .map((c) => c.revealScore)
                .filter((v): v is number => v !== null)
        ),
        riskControl: mean(
            contracts.map((c) => Math.exp(-Math.abs(c.finalInventory) / (0.5 * positionLimit)))
        ),
        pnlSd: Math.sqrt(mean(pnls.map((p) => (p - avgPnl) ** 2))),
        maxInventory: contracts.reduce((max, c) => Math.max(max, Math.abs(c.finalInventory)), 0),
    };
}
