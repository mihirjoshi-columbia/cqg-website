import type { Contract } from "./contracts";

// The contract sets.
//
// Parameters are chosen so the mental arithmetic is reachable under a clock:
// n*p lands on a round number and the variance lands on or near a perfect
// square. The point is to test whether a player knows WHICH formula applies
// and can size a spread to the answer, not whether they can take an awkward
// square root.

/** The Week 3 homework set: each distribution once, then two combined. */
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

export const HOMEWORK_CONTRACTS = WEEK3_CONTRACTS;
