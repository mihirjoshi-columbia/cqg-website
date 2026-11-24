// The competitive programming set: four problems, judged in the browser.
//
// Metadata only. Statements are JSX in components/cp/Statements.tsx, and the
// tests (expected outputs included) are served by app/api/cp/tests/[id] to
// Internal Members only, so neither ships in this module.
//
// Samples live here because the statement shows them AND the test script
// (scripts/gen-cp-tests.mts) re-derives each sample's output from the
// reference solution, so a typo in a sample fails the script instead of
// confusing a member.

export type Checker = "exact" | "float";

export interface CpProblem {
    id: string;
    letter: string;
    title: string;
    source: { label: string; url: string };
    /** Per test. Generous because Python in the browser runs slower than a judge. */
    timeLimitMs: number;
    /** "float" accepts an absolute or relative error of at most FLOAT_TOLERANCE. */
    checker: Checker;
    samples: { input: string; output: string }[];
}

export const FLOAT_TOLERANCE = 1e-6;

export const CP_PROBLEMS: CpProblem[] = [
    {
        id: "best-streak",
        letter: "A",
        title: "Nikhil's Best Streak",
        source: { label: "Codeforces 1155D", url: "https://codeforces.com/problemset/problem/1155/D" },
        timeLimitMs: 4000,
        checker: "exact",
        samples: [
            { input: "5 -2\n-3 8 -2 1 -6\n", output: "22\n" },
            { input: "6 3\n1 -1 2 -2 3 -3\n", output: "9\n" },
            { input: "4 10\n-5 -1 -7 -2\n", output: "0\n" },
        ],
    },
    {
        id: "dice-game",
        letter: "B",
        title: "Nicole's Dice Game",
        source: { label: "AtCoder ABC266 E", url: "https://atcoder.jp/contests/abc266/tasks/abc266_e" },
        timeLimitMs: 4000,
        checker: "float",
        samples: [
            { input: "1\n", output: "3.5000000000\n" },
            { input: "2\n", output: "4.2500000000\n" },
            { input: "10\n", output: "5.6502176688\n" },
        ],
    },
    {
        id: "count-down",
        letter: "C",
        title: "Victor Counts Down",
        source: { label: "AtCoder ABC350 E", url: "https://atcoder.jp/contests/abc350/tasks/abc350_e" },
        timeLimitMs: 4000,
        checker: "float",
        samples: [
            { input: "7 2 10 15\n", output: "30.0000000000\n" },
            { input: "7 3 30 12\n", output: "30.5280000000\n" },
            { input: "1000000000000000000 3 1000000 999999\n", output: "37795728.9985181466\n" },
        ],
    },
    {
        id: "target",
        letter: "D",
        title: "Ivy's Target",
        source: { label: "AtCoder ABC224 G", url: "https://atcoder.jp/contests/abc224/tasks/abc224_g" },
        timeLimitMs: 4000,
        checker: "float",
        samples: [
            { input: "5 2 4 10 4\n", output: "15.0000000000\n" },
            { input: "10 6 4 1 2\n", output: "6.5000000000\n" },
            { input: "1000000000 1000000000 1 1000000000 1\n", output: "1000000000.0000000000\n" },
        ],
    },
];

export function findProblem(id: string): CpProblem | undefined {
    return CP_PROBLEMS.find((p) => p.id === id);
}

/** One judged test. Large inputs are stored as a generator recipe, not text. */
export interface CpTest {
    input?: string;
    gen?: StreakGen;
    output: string;
}

/** Recipe for a large Nikhil's Best Streak input; see lib/cp/generate.ts. */
export interface StreakGen {
    seed: number;
    n: number;
    /** Fixed leverage factor, or null to draw one in [-100, 100]. */
    x: number | null;
    lo: number;
    hi: number;
    /** "alternating" swaps hi and lo each day instead of drawing. */
    pattern: "random" | "alternating";
}
