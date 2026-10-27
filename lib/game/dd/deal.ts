import { mulberry32 } from "../prng";
import {
    afterReveal,
    moments,
    nothingSeen,
    realise,
    type Contract,
    type Leg,
} from "./contracts";

// Deal generation for Distribution Desk.
//
// This file replaces what used to be a hand-written contract list plus a
// hand-picked seed set (lib/game/dd/library.ts and seeds.ts, both deleted).
// Every run now gets its own deal: the same seven SLOTS in the same order --
// two binomials, two geometrics, a CLT sum, a normal and a composite -- drawn
// with different parameters each time. The curriculum is fixed, the numbers
// are not, so a player cannot learn "contract 3 is 30 and 27.4 wide" and must
// actually do the arithmetic.
//
// A whole deal is a deterministic function of ONE integer, the deal seed:
// parameters, reveal sizes and each contract's realisation seed all come out
// of a single generator consumed in strict order. That is what keeps the
// stateless replay working -- the sealed session token carries the deal seed
// and nothing else, and the server rebuilds the identical deal on every
// request. Nothing here may become data-dependent in a way that changes how
// many draws are consumed, for the same reason lib/game/dd/engine.ts gives.
//
// Parameters come from curated pools rather than from a continuous range, so
// the mental arithmetic stays reachable under a clock: n*p lands on a round
// number and the variance lands on or near a perfect square. The point is to
// test whether a player knows WHICH formula applies, not whether they can
// take an awkward square root.

export const DD_CONTRACT_COUNT = 7;

/** A generated deal: the contracts, and the realisation seed for each. */
export interface Deal {
    contracts: Contract[];
    seeds: number[];
}

// ---------------------------------------------------------------------------
// Parameter pools
//
// Each entry carries its own English phrasing. Generating prose from raw
// parameters produced sentences like "a coin that lands heads 50% of the
// time", which reads as a trick; a coin, a die and an abstract trial are
// different objects to a student, so the pool names which one it is.
// ---------------------------------------------------------------------------

interface BinomialSpec {
    n: number;
    p: number;
    phrase: string;
}

const BINOMIAL_POOL: readonly BinomialSpec[] = [
    { n: 40, p: 0.35, phrase: "the number of heads in 40 flips of a coin that lands heads 35% of the time" },
    { n: 25, p: 0.4, phrase: "the number of successes in 25 independent trials, each succeeding with probability 0.4" },
    { n: 16, p: 0.5, phrase: "the number of heads in 16 flips of a fair coin" },
    { n: 60, p: 0.5, phrase: "the number of heads in 60 flips of a fair coin" },
    { n: 30, p: 1 / 6, phrase: "the number of sixes in 30 rolls of a fair die" },
    { n: 50, p: 0.2, phrase: "the number of successes in 50 independent trials, each succeeding with probability 0.2" },
    { n: 36, p: 0.25, phrase: "the number of successes in 36 independent trials, each succeeding with probability 0.25" },
    { n: 45, p: 0.2, phrase: "the number of successes in 45 independent trials, each succeeding with probability 0.2" },
    { n: 80, p: 0.15, phrase: "the number of successes in 80 independent trials, each succeeding with probability 0.15" },
    { n: 20, p: 0.75, phrase: "the number of successes in 20 independent trials, each succeeding with probability 0.75" },
    { n: 48, p: 1 / 3, phrase: "the number of successes in 48 independent trials, each succeeding with probability 1/3" },
    { n: 64, p: 0.25, phrase: "the number of successes in 64 independent trials, each succeeding with probability 0.25" },
];

interface GeometricSpec {
    p: number;
    cap: number;
    phrase: string;
}

const GEOMETRIC_POOL: readonly GeometricSpec[] = [
    { p: 1 / 6, cap: 60, phrase: "the number of rolls of a fair die until the first 6 appears, counting that roll" },
    { p: 0.5, cap: 30, phrase: "the number of flips of a fair coin until the first head, counting that flip" },
    { p: 0.25, cap: 60, phrase: "the number of independent trials until the first success, counting that trial, when each trial succeeds with probability 0.25" },
    { p: 0.2, cap: 80, phrase: "the number of independent trials until the first success, counting that trial, when each trial succeeds with probability 0.2" },
    { p: 1 / 3, cap: 40, phrase: "the number of independent trials until the first success, counting that trial, when each trial succeeds with probability 1/3" },
    { p: 0.1, cap: 150, phrase: "the number of independent trials until the first success, counting that trial, when each trial succeeds with probability 0.1" },
    { p: 1 / 20, cap: 250, phrase: "the number of spins of a 20-slot wheel until it first lands on slot 1, counting that spin" },
];

interface UniformSumSpec {
    count: number;
    lo: number;
    hi: number;
}

// Chosen so count * (hi - lo)^2 / 12 is a perfect square: the whole contract's
// SD is a round number even though each draw's is not.
const UNIFORM_SUM_POOL: readonly UniformSumSpec[] = [
    { count: 12, lo: 0, hi: 100 },
    { count: 12, lo: 0, hi: 60 },
    { count: 48, lo: 0, hi: 50 },
    { count: 27, lo: 0, hi: 120 },
    { count: 12, lo: 20, hi: 80 },
    { count: 75, lo: 0, hi: 24 },
    { count: 3, lo: 0, hi: 120 },
    { count: 48, lo: 10, hi: 110 },
];

const NORMAL_MU: readonly number[] = [120, 150, 200, 250, 300, 350, 400];
const NORMAL_SIGMA: readonly number[] = [20, 30, 40, 50, 60, 80];
const NORMAL_PARTS: readonly number[] = [2, 2, 4];

const BINOMIAL_MULTIPLIERS: readonly number[] = [1, 2, 5, 10, 20];
const GEOMETRIC_MULTIPLIERS: readonly number[] = [1, 2, 5, 10, 20];

/** Fractions of a leg a reveal can expose. */
const REVEAL_FRACTIONS: readonly number[] = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function pick<T>(rng: () => number, pool: readonly T[]): T {
    return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
}

/** `units` for a fractional reveal of a leg with `total` units, kept in 1..total-1. */
function revealUnits(rng: () => number, total: number): number {
    const raw = Math.round(total * pick(rng, REVEAL_FRACTIONS));
    return Math.min(total - 1, Math.max(1, raw));
}

function multiplierPhrase(multiplier: number, phrase: string): string {
    return multiplier === 1 ? `Settles at ${phrase}.` : `Settles at ${multiplier} x ${phrase}.`;
}

/** SD of one unit-multiplier leg, used to balance the composite's two legs. */
function legSd(leg: Leg): number {
    switch (leg.kind) {
        case "binomial":
            return Math.sqrt(leg.n * leg.p * (1 - leg.p));
        case "geometric":
            return Math.sqrt((1 - leg.p) / (leg.p * leg.p));
        case "normal":
            return leg.sigma;
        case "uniformSum":
            return Math.sqrt((leg.count * (leg.hi - leg.lo) ** 2) / 12);
    }
}

type Slot = "binomial" | "geometric" | "uniformSum" | "normal" | "composite";

/**
 * The slot order. Fixed on purpose: the set has to cover the same ground every
 * time, and the composite -- where variances add and standard deviations do
 * not -- has to come last, after the player has priced each piece alone.
 */
const SLOTS: readonly Slot[] = [
    "binomial",
    "geometric",
    "uniformSum",
    "binomial",
    "normal",
    "geometric",
    "composite",
];

function drawContract(slot: Slot, rng: () => number, index: number): Contract {
    const id = `dd-${index + 1}-${slot}`;

    switch (slot) {
        case "binomial": {
            const spec = pick(rng, BINOMIAL_POOL);
            const multiplier = pick(rng, BINOMIAL_MULTIPLIERS);
            return {
                id,
                description: multiplierPhrase(multiplier, spec.phrase),
                legs: [{ kind: "binomial", n: spec.n, p: spec.p, multiplier }],
                reveal: { legIndex: 0, units: revealUnits(rng, spec.n) },
            };
        }
        case "geometric": {
            const spec = pick(rng, GEOMETRIC_POOL);
            const multiplier = pick(rng, GEOMETRIC_MULTIPLIERS);
            // A geometric reveal exposes only the first few trials. More would
            // make a success in the prefix nearly certain, and a resolved
            // prefix kills the memorylessness lesson -- the reveal that moves
            // the price without removing any risk.
            const units = 1 + Math.floor(rng() * 3);
            return {
                id,
                description: multiplierPhrase(multiplier, spec.phrase),
                legs: [{ kind: "geometric", p: spec.p, cap: spec.cap, multiplier }],
                reveal: { legIndex: 0, units },
            };
        }
        case "uniformSum": {
            const spec = pick(rng, UNIFORM_SUM_POOL);
            return {
                id,
                description: multiplierPhrase(
                    1,
                    `the sum of ${spec.count} independent draws, each uniform between ${spec.lo} and ${spec.hi}`
                ),
                legs: [{ kind: "uniformSum", count: spec.count, lo: spec.lo, hi: spec.hi, multiplier: 1 }],
                reveal: { legIndex: 0, units: revealUnits(rng, spec.count) },
            };
        }
        case "normal": {
            const mu = pick(rng, NORMAL_MU);
            const sigma = pick(rng, NORMAL_SIGMA);
            const parts = pick(rng, NORMAL_PARTS);
            return {
                id,
                // The components are stated because the reveal shows a prefix
                // of them, and because working out what seeing one of four
                // does to the remaining variance is the exercise.
                description: multiplierPhrase(
                    1,
                    `a single draw from a normal distribution with mean ${mu} and standard deviation ${sigma}, ` +
                        `built as the sum of ${parts} independent components of equal variance`
                ),
                legs: [{ kind: "normal", mu, sigma, parts, multiplier: 1 }],
                reveal: { legIndex: 0, units: revealUnits(rng, parts) },
            };
        }
        case "composite": {
            const binomial = pick(rng, BINOMIAL_POOL);
            const geometric = pick(rng, GEOMETRIC_POOL);
            const binomialMultiplier = pick(rng, BINOMIAL_MULTIPLIERS);

            // The two legs are scaled to contribute comparable variance. If
            // one dominates, adding the SDs instead of the variances is barely
            // wrong and the contract stops teaching anything.
            const target = binomialMultiplier * legSd({ kind: "binomial", ...binomial, multiplier: 1 });
            const unit = legSd({ kind: "geometric", ...geometric, multiplier: 1 });
            const geometricMultiplier = GEOMETRIC_MULTIPLIERS.reduce((best, m) =>
                Math.abs(Math.log((m * unit) / target)) < Math.abs(Math.log((best * unit) / target))
                    ? m
                    : best
            );

            const legs: Leg[] = [
                { kind: "binomial", n: binomial.n, p: binomial.p, multiplier: binomialMultiplier },
                { kind: "geometric", p: geometric.p, cap: geometric.cap, multiplier: geometricMultiplier },
            ];

            const first = binomialMultiplier === 1 ? binomial.phrase : `${binomialMultiplier} x ${binomial.phrase}`;
            const second = geometricMultiplier === 1 ? geometric.phrase : `${geometricMultiplier} x ${geometric.phrase}`;

            // Revealing the whole binomial leg leaves the geometric leg alone
            // carrying the risk; revealing part of it leaves both. Both are
            // worth meeting, so which one happens is drawn.
            const whole = rng() < 0.5;
            return {
                id,
                description: `Settles at the sum of two independent contracts: ${first}, plus ${second}.`,
                legs,
                reveal: {
                    legIndex: 0,
                    units: whole ? binomial.n : revealUnits(rng, binomial.n),
                },
            };
        }
    }
}

// ---------------------------------------------------------------------------
// Acceptance
//
// Not every draw makes a usable contract. These are the same two teaching
// constraints the deleted scripts/pick-dd-seeds.mts enforced by hand, now
// applied at deal time, plus a scale gate so the numbers stay quotable.
// ---------------------------------------------------------------------------

const MAX_SETTLEMENT_SDS = 2.5;
const MIN_PRIOR_SD = 3;
const MAX_FAIR = 3000;

/** Realisation-independent sanity: is this contract worth quoting at all? */
function inScale(contract: Contract): boolean {
    const probe = realise(contract, mulberry32(1));
    const prior = moments(contract, probe, nothingSeen(contract));
    return prior.sd >= MIN_PRIOR_SD && Math.abs(prior.fair) <= MAX_FAIR;
}

/**
 * Is this realisation of this contract one a player should be dealt?
 *
 *  1. A geometric reveal must show no success. Otherwise the contract resolves
 *     at the reveal and the memorylessness lesson -- the reveal moves the
 *     price but not the risk -- never gets a chance to fire.
 *  2. The reveal must leave some risk, or the re-quote is a formality.
 *  3. Settlement must land within a few SDs of the prior fair, so no single
 *     freak outcome decides a run.
 *
 * Exported because scripts/check-dd-game.mts asserts it over many deals.
 */
export function acceptable(contract: Contract, seed: number): boolean {
    const realisation = realise(contract, mulberry32(seed));
    const prior = moments(contract, realisation, nothingSeen(contract));
    const post = moments(contract, realisation, afterReveal(contract));

    if (post.sd <= 0) return false;

    const revealLeg = contract.legs[contract.reveal.legIndex]!;
    if (revealLeg.kind === "geometric") {
        const prefix = realisation.units[contract.reveal.legIndex]!.slice(0, contract.reveal.units);
        if (prefix.includes(1)) return false;
        // And the post-reveal SD must be unchanged, which is the whole point.
        if (Math.abs(post.sd - prior.sd) > 1e-9) return false;
    }

    if (prior.sd > 0) {
        const z = Math.abs(realisation.settlement - prior.fair) / prior.sd;
        if (z > MAX_SETTLEMENT_SDS) return false;
    }

    return true;
}

const SEED_SEARCH_LIMIT = 20_000;
const PARAM_ATTEMPT_LIMIT = 40;

/**
 * Builds one deal from one integer.
 *
 * Deterministic and total: the same seed always yields the same seven
 * contracts and the same seven realisation seeds, which is what the sealed
 * token relies on. The retry loops are bounded and throw rather than
 * degrading, because a deal that silently differed between two replays of the
 * same token would corrupt a score instead of failing a request.
 */
export function makeDeal(dealSeed: number): Deal {
    const rng = mulberry32(dealSeed);
    const contracts: Contract[] = [];
    const seeds: number[] = [];

    SLOTS.forEach((slot, index) => {
        for (let attempt = 0; attempt < PARAM_ATTEMPT_LIMIT; attempt++) {
            const contract = drawContract(slot, rng, index);
            if (!inScale(contract)) continue;

            let seed = Math.floor(rng() * 2 ** 31) >>> 0;
            let tried = 0;
            while (!acceptable(contract, seed)) {
                seed = (seed + 7919) >>> 0;
                if (++tried > SEED_SEARCH_LIMIT) break;
            }
            if (tried > SEED_SEARCH_LIMIT) continue;

            contracts.push(contract);
            seeds.push(seed);
            return;
        }
        throw new Error(`could not build a ${slot} contract for slot ${index}`);
    });

    return { contracts, seeds };
}
