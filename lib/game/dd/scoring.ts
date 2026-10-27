import { contractPnl, momentsAt, type ContractState } from "./engine";
import { configFor, type DdPreset } from "./presets";
import { DD_STAGES, type Stage } from "./types";
import type { RunState } from "./replay";

// Scoring has two jobs that pull in different directions.
//
// The LEADERBOARD needs one number, and it cannot be raw P&L any more. Every
// run is now dealt its own contracts, and P&L scales with how much risk the
// deal happened to contain: played perfectly, a deal of high-variance
// contracts pays several times what a quiet one does. Measured over 60 deals,
// identical correct play ranged from -729 to +2664. So the ranked number is
// `scaledPnl` -- each contract's P&L divided by that contract's own prior
// standard deviation, then summed. Perfect play scores about the same on
// every deal, which is what makes two players comparable.
//
// Raw `totalPnl` is still computed and still shown: it is the money, and it
// is what makes a bad fill feel bad. It is just not what ranks anybody.
//
// The EVALUATION needs to say which idea a student is missing, which a single
// P&L cannot: a player can lose money from mispricing, from mis-sizing the
// spread, from misreading a reveal, or from carrying risk they did not need.
// The sub-scores below separate those four, so a weak run is diagnosable.
//
// Sub-scores are all 0..1 and are reported, never summed into the rank.
//
// VERDICTS, by contrast, are what the PLAYER is shown. Everything numeric in
// here -- the true fair, the true SD, the exact errors -- is the answer to the
// exercise, so none of it reaches the browser; lib/game/dd/project.ts passes
// on the verdicts alone. The numbers are still computed and still stored on
// the attempt row, so an admin can see exactly where a run went wrong.

/**
 * How a player's answer is reported back to them.
 *
 * Deliberately three buckets and no number. "Correct" is the +/-5% band the
 * exercise asks for; "close" runs out to 20%, which is wide enough to mean
 * "you used the right formula and slipped" and narrow enough that it cannot
 * be reached by guessing.
 */
export type Verdict = "correct" | "close" | "off";

export const CORRECT_WITHIN = 0.05;
export const CLOSE_WITHIN = 0.2;

/** Bucket a relative error (0 = exact, 0.05 = 5% out). */
export function verdictFor(relativeError: number): Verdict {
    if (relativeError <= CORRECT_WITHIN) return "correct";
    if (relativeError <= CLOSE_WITHIN) return "close";
    return "off";
}

/**
 * Bucket a 0..1 sub-score, for the two dimensions that have no natural
 * percentage: responding to a reveal, and inventory discipline.
 */
export function verdictForScore(score: number): Verdict {
    if (score >= 0.9) return "correct";
    if (score >= 0.6) return "close";
    return "off";
}

export interface StageDetail {
    stage: Stage;
    fair: number;
    sd: number;
    mid: number;
    width: number;
    /** Distance from fair, in SDs. Lower is better. Feeds the sub-scores. */
    pricingError: number;
    /** Quoted width as a multiple of the SD. The flow model rewards ~1. */
    widthRatio: number | null;
    /**
     * Distance from fair as a FRACTION OF THE FAIR, which is what the player
     * is graded on: it answers "did you get the mean right", independently of
     * how risky the contract happens to be.
     */
    priceError: number;
    /** |width - sd| / sd: "did you get the standard deviation right". */
    widthError: number | null;
    priceVerdict: Verdict;
    widthVerdict: Verdict | null;
}

export interface ContractDetail {
    contractId: string;
    pnl: number;
    /** P&L in units of this contract's prior SD. Comparable across deals. */
    scaledPnl: number;
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
    /** The ranked number: sum of each contract's SD-scaled P&L. */
    scaledPnl: number;
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
    /** The same four dimensions, bucketed. This is all the player sees. */
    verdicts: {
        pricing: Verdict;
        width: Verdict;
        reveal: Verdict;
        risk: Verdict;
    };
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

    const priceError = Math.abs(mid - fair) / Math.max(Math.abs(fair), 1);
    // With no uncertainty left there is no "right" width to compare to.
    const widthError = sd > 0 ? Math.abs(width - sd) / sd : null;

    return {
        stage,
        fair,
        sd,
        mid,
        width,
        pricingError: Math.abs(mid - fair) / errorScale(sd, priorSd),
        widthRatio: sd > 0 ? width / sd : null,
        priceError,
        widthError,
        priceVerdict: verdictFor(priceError),
        widthVerdict: widthError === null ? null : verdictFor(widthError),
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
            const pnl = contractPnl(state);
            return {
                contractId: state.contract.id,
                pnl,
                // Divided by the prior SD, not the post-reveal one: the prior
                // is the risk the whole contract was ever worth, and it does
                // not depend on how the player quoted.
                scaledPnl: pnl / Math.max(priorSd, 1),
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

    const revealResponse = mean(
        contracts.map((c) => c.revealScore).filter((v): v is number => v !== null)
    );
    const riskControl = mean(
        contracts.map((c) => Math.exp(-Math.abs(c.finalInventory) / (0.5 * positionLimit)))
    );

    // The verdicts bucket the MEAN error over the run rather than the worst
    // stage. One fumbled contract out of six should not read the same as
    // six wrong formulas.
    const widthErrors = allStages
        .map((s) => s.widthError)
        .filter((v): v is number => v !== null);

    return {
        totalPnl,
        scaledPnl: contracts.reduce((sum, c) => sum + c.scaledPnl, 0),
        contracts,
        pricing: mean(allStages.map((s) => Math.exp(-s.pricingError))),
        widthCalibration: mean(
            allStages
                .filter((s): s is StageDetail & { widthRatio: number } => s.widthRatio !== null)
                .map((s) => Math.exp(-Math.abs(Math.log(Math.max(s.widthRatio, 1e-6)))))
        ),
        revealResponse,
        riskControl,
        pnlSd: Math.sqrt(mean(pnls.map((p) => (p - avgPnl) ** 2))),
        maxInventory: contracts.reduce((max, c) => Math.max(max, Math.abs(c.finalInventory)), 0),
        verdicts: {
            pricing: verdictFor(mean(allStages.map((s) => s.priceError))),
            width: widthErrors.length ? verdictFor(mean(widthErrors)) : "off",
            reveal: verdictForScore(revealResponse),
            risk: verdictForScore(riskControl),
        },
    };
}
