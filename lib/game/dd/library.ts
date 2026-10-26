import type { Contract } from "./contracts";

// The contract sets.
//
// Parameters are chosen so the mental arithmetic is reachable under a clock:
// n*p lands on a round number and the variance lands on or near a perfect
// square. The point is to test whether a player knows WHICH formula applies
// and can size a spread to the answer, not whether they can take an awkward
// square root.

/** Week 3 homework. Covers each distribution once, then combines two. */
export const WEEK3_CONTRACTS: Contract[] = [
    {
        id: "w3-binomial-coin",
        description: "Settles at 10 x the number of heads in 40 flips of a coin that lands heads 35% of the time.",
        legs: [{ kind: "binomial", n: 40, p: 0.35, multiplier: 10 }],
        reveal: { legIndex: 0, units: 10 },
        lesson: "Fair = 10np = 140, SD = 10 x sqrt(np(1-p)) = 30.2. After the reveal the remaining trials carry the risk, so the market both re-centres and tightens.",
    },
    {
        id: "w3-binomial-trials",
        description: "Settles at 20 x the number of successes in 25 independent trials, each succeeding with probability 0.4.",
        legs: [{ kind: "binomial", n: 25, p: 0.4, multiplier: 20 }],
        reveal: { legIndex: 0, units: 10 },
        lesson: "Fair = 20np = 200, SD = 20 x sqrt(6) = 49. Variance falls in proportion to the trials still outstanding.",
    },
    {
        id: "w3-geometric-die",
        description: "Settles at 5 x the number of rolls of a fair die until the first 6 appears, counting that roll.",
        legs: [{ kind: "geometric", p: 1 / 6, cap: 60, multiplier: 5 }],
        reveal: { legIndex: 0, units: 3 },
        lesson: "Fair = 5/p = 30, SD = 5 x sqrt((1-p)/p^2) = 27.4. Three rolls without a 6 move the fair to 45 and leave the SD UNCHANGED: memorylessness means the reveal repriced the contract without removing any risk.",
    },
    {
        id: "w3-geometric-coin",
        description: "Settles at 10 x the number of flips of a fair coin until the first head, counting that flip.",
        legs: [{ kind: "geometric", p: 0.5, cap: 30, multiplier: 10 }],
        reveal: { legIndex: 0, units: 2 },
        lesson: "Fair = 10/p = 20, SD = 10 x sqrt(2) = 14.1. Same memorylessness as the die, at a width small enough that over-wide quoting is punished by lost volume.",
    },
    {
        id: "w3-clt-sum",
        description: "Settles at the sum of 12 independent draws, each uniform between 0 and 100.",
        legs: [{ kind: "uniformSum", count: 12, lo: 0, hi: 100, multiplier: 1 }],
        reveal: { legIndex: 0, units: 6 },
        lesson: "Each draw has mean 50 and variance 100^2/12. Twelve of them give fair 600 and SD exactly 100. Half revealed leaves SD = 100/sqrt(2) = 70.7.",
    },
    {
        id: "w3-normal",
        description: "Settles at a single draw from a normal distribution with mean 250 and standard deviation 40.",
        legs: [{ kind: "normal", mu: 250, sigma: 40, parts: 2, multiplier: 1 }],
        reveal: { legIndex: 0, units: 1 },
        lesson: "Fair 250, SD 40. The draw is the sum of two independent halves, so seeing one halves the remaining variance: SD falls to 28.3.",
    },
    {
        id: "w3-composite",
        description: "Settles at the sum of two independent contracts: 10 x heads in 40 flips at 35%, plus 5 x rolls of a fair die until the first 6.",
        legs: [
            { kind: "binomial", n: 40, p: 0.35, multiplier: 10 },
            { kind: "geometric", p: 1 / 6, cap: 60, multiplier: 5 },
        ],
        reveal: { legIndex: 0, units: 40 },
        lesson: "VARIANCES add, standard deviations do not. Fair 170, variance 910 + 750 = 1660, SD 40.7 -- not 30.2 + 27.4 = 57.6. Quoting 57 wide here hands away the edge.",
    },
];

/** Midpoint evaluation. Same processes, less forgiving numbers, two composites. */
export const MIDPOINT_CONTRACTS: Contract[] = [
    {
        id: "mid-binomial-wide",
        description: "Settles at 5 x the number of successes in 60 independent trials, each succeeding with probability 0.3.",
        legs: [{ kind: "binomial", n: 60, p: 0.3, multiplier: 5 }],
        reveal: { legIndex: 0, units: 20 },
        lesson: "Fair = 5np = 90, SD = 5 x sqrt(12.6) = 17.8.",
    },
    {
        id: "mid-binomial-chunky",
        description: "Settles at 30 x the number of successes in 18 independent trials, each succeeding with probability 1/3.",
        legs: [{ kind: "binomial", n: 18, p: 1 / 3, multiplier: 30 }],
        reveal: { legIndex: 0, units: 6 },
        lesson: "Fair 180, SD = 30 x sqrt(4) = 60. A large multiplier on few trials makes this the widest market in the set.",
    },
    {
        id: "mid-geometric",
        description: "Settles at 4 x the number of independent trials until the first success, where each trial succeeds with probability 0.2.",
        legs: [{ kind: "geometric", p: 0.2, cap: 80, multiplier: 4 }],
        reveal: { legIndex: 0, units: 4 },
        lesson: "Fair 20, SD = 4 x sqrt(20) = 17.9. Four failures move the fair to 36 and leave the SD at 17.9.",
    },
    {
        id: "mid-normal",
        description: "Settles at a single draw from a normal distribution with mean 400 and standard deviation 60.",
        legs: [{ kind: "normal", mu: 400, sigma: 60, parts: 3, multiplier: 1 }],
        reveal: { legIndex: 0, units: 2 },
        lesson: "Fair 400, SD 60. Two of three independent thirds revealed leaves SD = 60/sqrt(3) = 34.6.",
    },
    {
        id: "mid-clt",
        description: "Settles at the sum of 20 independent draws, each uniform between 0 and 60.",
        legs: [{ kind: "uniformSum", count: 20, lo: 0, hi: 60, multiplier: 1 }],
        reveal: { legIndex: 0, units: 10 },
        lesson: "Fair 600, variance 20 x 300 = 6000, SD 77.5. Half revealed leaves SD 54.8.",
    },
    {
        id: "mid-composite-binomial-normal",
        description: "Settles at the sum of two independent contracts: 10 x heads in 24 flips of a fair coin, plus a draw from a normal distribution with mean 100 and standard deviation 50.",
        legs: [
            { kind: "binomial", n: 24, p: 0.5, multiplier: 10 },
            { kind: "normal", mu: 100, sigma: 50, parts: 1, multiplier: 1 },
        ],
        reveal: { legIndex: 0, units: 24 },
        lesson: "Fair 220, variance 600 + 2500 = 3100, SD 55.7. The reveal settles the binomial leg entirely, leaving the normal's SD of 50 -- barely tighter. Most of the risk was never in the coin.",
    },
    {
        id: "mid-composite-geometric-clt",
        description: "Settles at the sum of two independent contracts: 8 x the number of trials until the first success at probability 0.25, plus the sum of 6 draws uniform between 0 and 40.",
        legs: [
            { kind: "geometric", p: 0.25, cap: 60, multiplier: 8 },
            { kind: "uniformSum", count: 6, lo: 0, hi: 40, multiplier: 1 },
        ],
        reveal: { legIndex: 1, units: 6 },
        lesson: "Fair 152, variance 768 + 800 = 1568, SD 39.6. The reveal resolves the UNIFORM leg, so what remains is the geometric's SD of 27.7. Read which leg the information actually landed on.",
    },
];

export const CONTRACT_SETS = {
    week3: WEEK3_CONTRACTS,
    midpoint: MIDPOINT_CONTRACTS,
} as const;

export type ContractSetName = keyof typeof CONTRACT_SETS;

export function isContractSetName(value: unknown): value is ContractSetName {
    return value === "week3" || value === "midpoint";
}
