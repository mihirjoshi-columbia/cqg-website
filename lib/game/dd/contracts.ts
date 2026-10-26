// Contract library for Distribution Desk.
//
// A contract settles on a random PROCESS rather than on a sum of dealt cards,
// which is the whole point of the game: the player cannot price it by
// arithmetic, only by knowing the mean and variance of a binomial, geometric
// or normal.
//
// Every contract is a sum of independent legs, each a primitive process with
// a multiplier. Settlement is the multiplier-weighted sum of the legs, so
// variances add (sum over legs of multiplier^2 * leg variance) -- which is
// exactly the property the composite contract is there to test.

export type LegKind = "binomial" | "geometric" | "normal" | "uniformSum";

interface LegCommon {
    multiplier: number;
}

/** Successes in `n` independent trials. One unit = one trial. */
export interface BinomialLeg extends LegCommon {
    kind: "binomial";
    n: number;
    p: number;
}

/**
 * Trials until the first success, counting the successful trial.
 *
 * `cap` bounds the sample so the number of PRNG draws is fixed; a run that
 * reaches the cap settles there. With the parameters in the library the cap
 * is far enough out that this changes the mean by a negligible amount.
 * One unit = one trial.
 */
export interface GeometricLeg extends LegCommon {
    kind: "geometric";
    p: number;
    cap: number;
}

/**
 * A normal draw, represented as the sum of `parts` iid pieces so that a
 * prefix of it can be revealed. The total is always N(mu, sigma^2).
 * One unit = one part.
 */
export interface NormalLeg extends LegCommon {
    kind: "normal";
    mu: number;
    sigma: number;
    parts: number;
}

/** Sum of `count` iid Uniform(lo, hi) draws -- the CLT contract. One unit = one draw. */
export interface UniformSumLeg extends LegCommon {
    kind: "uniformSum";
    count: number;
    lo: number;
    hi: number;
}

export type Leg = BinomialLeg | GeometricLeg | NormalLeg | UniformSumLeg;

export interface Contract {
    id: string;
    /** Shown to the player. Must state the process and its parameters exactly. */
    description: string;
    legs: Leg[];
    /** Which leg is partially exposed between the two quotes, and how much. */
    reveal: { legIndex: number; units: number };
    /** One line shown after settlement explaining the intended reasoning. */
    lesson: string;
}

// --------------------------------------------------------------------------
// Unit counts and realisation
//
// CRITICAL INVARIANT: a contract's entire realisation is drawn up front, in a
// fixed order, before the player makes any decision. That is what keeps the
// number of PRNG draws independent of what the player does, so the server can
// replay the run and reproduce exactly what the player saw. Nothing downstream
// may consume the generator.
// --------------------------------------------------------------------------

/** Number of unit outcomes a leg draws. Fixed, never data-dependent. */
export function legUnits(leg: Leg): number {
    switch (leg.kind) {
        case "binomial":
            return leg.n;
        case "geometric":
            return leg.cap;
        case "normal":
            return leg.parts;
        case "uniformSum":
            return leg.count;
    }
}

/** The per-unit outcomes of one leg: trial results, parts, or draws. */
export type LegUnits = number[];

export interface Realisation {
    /** One array of unit outcomes per leg, in leg order. */
    units: LegUnits[];
    /** Settlement value of the whole contract. */
    settlement: number;
}

/** Box-Muller. Consumes exactly two draws, always. */
function standardNormal(random: () => number): number {
    // Guard against log(0); u is in (0, 1].
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function drawLeg(leg: Leg, random: () => number): LegUnits {
    const units: LegUnits = [];
    switch (leg.kind) {
        case "binomial":
            for (let i = 0; i < leg.n; i++) units.push(random() < leg.p ? 1 : 0);
            return units;
        case "geometric":
            // Always draws `cap` trials so the count is fixed; the value is
            // the index of the first 1, read off below.
            for (let i = 0; i < leg.cap; i++) units.push(random() < leg.p ? 1 : 0);
            return units;
        case "normal":
            for (let i = 0; i < leg.parts; i++) {
                units.push(leg.mu / leg.parts + standardNormal(random) * (leg.sigma / Math.sqrt(leg.parts)));
            }
            return units;
        case "uniformSum":
            for (let i = 0; i < leg.count; i++) units.push(leg.lo + random() * (leg.hi - leg.lo));
            return units;
    }
}

/** Value of a leg once all of its units are known. */
export function legValue(leg: Leg, units: LegUnits): number {
    switch (leg.kind) {
        case "binomial":
            return leg.multiplier * units.reduce((sum, u) => sum + u, 0);
        case "geometric": {
            const first = units.indexOf(1);
            // No success inside the cap: settle at the cap.
            return leg.multiplier * (first === -1 ? leg.cap : first + 1);
        }
        case "normal":
        case "uniformSum":
            return leg.multiplier * units.reduce((sum, u) => sum + u, 0);
    }
}

export function realise(contract: Contract, random: () => number): Realisation {
    const units = contract.legs.map((leg) => drawLeg(leg, random));
    const settlement = contract.legs.reduce(
        (total, leg, i) => total + legValue(leg, units[i]!),
        0
    );
    return { units, settlement };
}

// --------------------------------------------------------------------------
// Posterior mean and variance
//
// `known[i]` is how many units of leg i the player has seen. With known = 0
// everywhere this returns the prior -- the numbers the player needs before
// the reveal.
// --------------------------------------------------------------------------

export interface Moments {
    fair: number;
    variance: number;
    sd: number;
}

/** Mean and variance of one leg given the first `seen` of its units. */
export function legMoments(leg: Leg, units: LegUnits, seen: number): { mean: number; variance: number } {
    const m = leg.multiplier;
    const m2 = m * m;

    switch (leg.kind) {
        case "binomial": {
            const observed = units.slice(0, seen).reduce((sum, u) => sum + u, 0);
            const remaining = leg.n - seen;
            return {
                mean: m * (observed + remaining * leg.p),
                variance: m2 * remaining * leg.p * (1 - leg.p),
            };
        }
        case "geometric": {
            const prefix = units.slice(0, seen);
            const hit = prefix.indexOf(1);
            if (hit !== -1) {
                // Resolved inside the revealed prefix: no uncertainty left.
                return { mean: m * (hit + 1), variance: 0 };
            }
            // MEMORYLESSNESS. `seen` failures shift the mean by exactly `seen`
            // and leave the variance untouched. The reveal moves the price but
            // removes no risk -- a player who tightens here has misread it.
            return {
                mean: m * (seen + 1 / leg.p),
                variance: m2 * ((1 - leg.p) / (leg.p * leg.p)),
            };
        }
        case "normal": {
            const observed = units.slice(0, seen).reduce((sum, u) => sum + u, 0);
            const remaining = leg.parts - seen;
            return {
                mean: m * (observed + (remaining * leg.mu) / leg.parts),
                variance: m2 * remaining * ((leg.sigma * leg.sigma) / leg.parts),
            };
        }
        case "uniformSum": {
            const observed = units.slice(0, seen).reduce((sum, u) => sum + u, 0);
            const remaining = leg.count - seen;
            const span = leg.hi - leg.lo;
            return {
                mean: m * (observed + (remaining * (leg.lo + leg.hi)) / 2),
                variance: m2 * remaining * ((span * span) / 12),
            };
        }
    }
}

/**
 * Mean and standard deviation of the whole contract given how much of each
 * leg has been revealed. Legs are independent, so variances add.
 */
export function moments(contract: Contract, realisation: Realisation, seen: number[]): Moments {
    let fair = 0;
    let variance = 0;
    contract.legs.forEach((leg, i) => {
        const leg_ = legMoments(leg, realisation.units[i]!, seen[i] ?? 0);
        fair += leg_.mean;
        variance += leg_.variance;
    });
    return { fair, variance, sd: Math.sqrt(variance) };
}

/** `seen` with nothing revealed. */
export function nothingSeen(contract: Contract): number[] {
    return contract.legs.map(() => 0);
}

/** `seen` after the contract's scheduled reveal. */
export function afterReveal(contract: Contract): number[] {
    const seen = nothingSeen(contract);
    seen[contract.reveal.legIndex] = contract.reveal.units;
    return seen;
}

/**
 * Human-readable description of what the reveal exposed, for the UI.
 * Deliberately states raw outcomes, never a posterior -- working out what the
 * reveal implies is the exercise.
 */
export function describeReveal(contract: Contract, realisation: Realisation): string {
    const { legIndex, units: count } = contract.reveal;
    const leg = contract.legs[legIndex]!;
    const prefix = realisation.units[legIndex]!.slice(0, count);

    switch (leg.kind) {
        case "binomial": {
            const hits = prefix.reduce((sum, u) => sum + u, 0);
            return `First ${count} of the ${leg.n} trials are in: ${hits} success${hits === 1 ? "" : "es"}.`;
        }
        case "geometric": {
            const hit = prefix.indexOf(1);
            return hit === -1
                ? `First ${count} trial${count === 1 ? "" : "s"} resolved: no success yet.`
                : `Success arrived on trial ${hit + 1}.`;
        }
        case "normal": {
            const sum = prefix.reduce((s, u) => s + u, 0);
            return `${count} of the ${leg.parts} components are in, totalling ${sum.toFixed(1)}.`;
        }
        case "uniformSum": {
            const sum = prefix.reduce((s, u) => s + u, 0);
            return `First ${count} of the ${leg.count} draws are in, totalling ${sum.toFixed(1)}.`;
        }
    }
}

/** True if the reveal left no uncertainty, so there is nothing to re-quote. */
export function resolvedByReveal(contract: Contract, realisation: Realisation): boolean {
    return moments(contract, realisation, afterReveal(contract)).variance === 0;
}
