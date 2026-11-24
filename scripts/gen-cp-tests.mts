// Generates the judge's tests for the competitive programming set.
//
//   npm run cp:tests
//
// Writes lib/cp/tests/<id>.json. Each expected output comes from a reference
// solution that lives only here -- never in the app -- and each reference is
// first cross-checked against a brute force on thousands of small inputs. A
// wrong reference would not crash anything; it would quietly reject correct
// solutions, which is the worst way for a judge to fail.
//
// The samples shown in each statement (lib/cp/problems.ts) are re-derived too,
// and the script refuses to write anything if one disagrees.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mulberry32 } from "../lib/game/prng";
import { CP_PROBLEMS, FLOAT_TOLERANCE, type CpTest, type StreakGen } from "../lib/cp/problems";
import { testInput } from "../lib/cp/generate";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../lib/cp/tests");
const random = mulberry32(20261123);

function randInt(lo: number, hi: number): number {
    return lo + Math.floor(random() * (hi - lo + 1));
}

function fmt(value: number): string {
    return `${value.toFixed(10)}\n`;
}

function close(a: number, b: number): boolean {
    return Math.abs(a - b) <= FLOAT_TOLERANCE * Math.max(1, Math.abs(b));
}

// ---------------------------------------------------------------------------
// A. Nikhil's Best Streak -- max subarray sum after scaling one block by x.
// Sums reach 3e5 * 1e9 * 100 = 3e16, past 2^53, so this runs in BigInt.
// ---------------------------------------------------------------------------

function parseStreak(input: string): { x: bigint; a: bigint[] } {
    const tokens = input.trim().split(/\s+/);
    const n = Number(tokens[0]);
    return { x: BigInt(tokens[1]), a: tokens.slice(2, 2 + n).map(BigInt) };
}

// BigInt(...) rather than 0n literals: tsconfig targets ES2017.
const [ZERO, TWO, SIX] = [BigInt(0), BigInt(2), BigInt(6)];
const max = (...values: bigint[]) => values.reduce((m, v) => (v > m ? v : m));

function solveStreak(input: string): string {
    const { x, a } = parseStreak(input);
    // before / inside / after the scaled block, each allowed to restart at 0.
    let before = ZERO;
    let inside = ZERO;
    let after = ZERO;
    let best = ZERO;
    for (const v of a) {
        const nextAfter = max(ZERO, max(inside, after) + v);
        const nextInside = max(ZERO, max(before, inside) + v * x);
        before = max(ZERO, before + v);
        inside = nextInside;
        after = nextAfter;
        best = max(best, before, inside, after);
    }
    return `${best}\n`;
}

function bruteStreak(input: string): string {
    const { x, a } = parseStreak(input);
    const kadane = (b: bigint[]) => {
        let best = ZERO;
        for (let l = 0; l < b.length; l++) {
            let sum = ZERO;
            for (let r = l; r < b.length; r++) {
                sum += b[r];
                best = max(best, sum);
            }
        }
        return best;
    };
    let best = kadane(a);
    for (let l = 0; l < a.length; l++) {
        for (let r = l; r < a.length; r++) {
            best = max(best, kadane(a.map((v, i) => (i >= l && i <= r ? v * x : v))));
        }
    }
    return `${best}\n`;
}

function streakTests(): CpTest[] {
    const tests: CpTest[] = [];
    for (let i = 0; i < 12; i++) {
        const n = randInt(1, 10);
        const a = Array.from({ length: n }, () => randInt(-10, 10));
        tests.push({ input: `${n} ${randInt(-3, 3)}\n${a.join(" ")}\n`, output: "" });
    }
    for (const input of [
        "1 5\n-7\n",
        "1 -1\n-7\n",
        "1 0\n5\n",
        "3 0\n-1 -1 -1\n",
        "3 100\n1000000000 1000000000 1000000000\n",
        "2 -100\n-1000000000 -1000000000\n",
        "5 -1\n3 -4 5 -6 7\n",
    ]) {
        tests.push({ input, output: "" });
    }
    const gens: Omit<StreakGen, "seed">[] = [
        { n: 2000, x: null, lo: -1e9, hi: 1e9, pattern: "random" },
        { n: 2000, x: -1, lo: -5, hi: 5, pattern: "random" },
        { n: 2000, x: 2, lo: -100, hi: 60, pattern: "random" },
        { n: 300000, x: null, lo: -1e9, hi: 1e9, pattern: "random" },
        { n: 300000, x: 100, lo: 1e9, hi: 1e9, pattern: "random" },
        { n: 300000, x: -100, lo: -1e9, hi: -1e9, pattern: "random" },
        { n: 300000, x: -100, lo: -1e9, hi: 1e9, pattern: "alternating" },
        { n: 300000, x: 0, lo: -1e9, hi: 1e9, pattern: "random" },
        { n: 300000, x: -37, lo: -100, hi: 100, pattern: "random" },
        { n: 300000, x: 1, lo: -1e9, hi: 1e9, pattern: "random" },
    ];
    for (const gen of gens) {
        tests.push({ gen: { ...gen, seed: randInt(1, 2 ** 31) }, output: "" });
    }
    return tests;
}

// ---------------------------------------------------------------------------
// B. Nicole's Dice Game -- optimal stopping over N rolls.
// ---------------------------------------------------------------------------

function solveDice(input: string): string {
    const n = Number(input.trim());
    let value = 3.5;
    for (let k = 2; k <= n; k++) {
        let sum = 0;
        for (let face = 1; face <= 6; face++) sum += Math.max(face, value);
        value = sum / 6;
    }
    return fmt(value);
}

/** Every stop-or-continue policy is "stop at >= threshold"; try them all. */
function bruteDice(input: string): string {
    const n = Number(input.trim());
    const go = (rollsLeft: number): number => {
        if (rollsLeft === 1) return 3.5;
        const later = go(rollsLeft - 1);
        let best = -Infinity;
        for (let threshold = 1; threshold <= 7; threshold++) {
            let sum = 0;
            for (let face = 1; face <= 6; face++) sum += face >= threshold ? face : later;
            best = Math.max(best, sum / 6);
        }
        return best;
    };
    return fmt(go(n));
}

function diceTests(): CpTest[] {
    return [3, 4, 6, 17, 25, 50, 73, 99, 100].map((n) => ({
        input: `${n}\n`,
        output: "",
    }));
}

// ---------------------------------------------------------------------------
// C. Victor Counts Down -- N up to 1e18, so BigInt keys. The roll-a-1 case
// leaves N unchanged; solving f = Y + (f + rest) / 6 for f gives the 6/5.
// ---------------------------------------------------------------------------

function parseCount(input: string) {
    const [n, a, x, y] = input.trim().split(/\s+/);
    return { n: BigInt(n), a: BigInt(a), x: Number(x), y: Number(y) };
}

function solveCount(input: string): string {
    const { n, a, x, y } = parseCount(input);
    const memo = new Map<bigint, number>([[ZERO, 0]]);
    const f = (m: bigint): number => {
        const hit = memo.get(m);
        if (hit !== undefined) return hit;
        let rest = 0;
        for (let b = TWO; b <= SIX; b++) rest += f(m / b);
        const value = Math.min(x + f(m / a), (6 * y + rest) / 5);
        memo.set(m, value);
        return value;
    };
    return fmt(f(n));
}

/** Value iteration on the raw Bellman equation, die face 1 included. */
function bruteCount(input: string): string {
    const { n, a, x, y } = parseCount(input);
    const size = Number(n);
    let f = new Array<number>(size + 1).fill(0);
    for (let iter = 0; iter < 400; iter++) {
        const next = f.slice();
        for (let m = 1; m <= size; m++) {
            let roll = 0;
            for (let b = 1; b <= 6; b++) roll += f[Math.floor(m / b)];
            next[m] = Math.min(x + f[Math.floor(m / Number(a))], y + roll / 6);
        }
        f = next;
    }
    return fmt(f[size]);
}

function randomBig(): string {
    const digits = randInt(1, 18);
    let s = String(randInt(1, 9));
    for (let i = 1; i < digits; i++) s += String(randInt(0, 9));
    return s;
}

function countTests(): CpTest[] {
    const inputs = [
        "1 2 1 1\n",
        "1 6 1000000000 1\n",
        "2 2 1 1000000000\n",
        "1000000000000000000 2 1 1000000000\n",
        "1000000000000000000 6 1000000000 1\n",
        "1000000000000000000 2 1000000000 1000000000\n",
        "999999999999999999 5 123456789 98765432\n",
    ];
    for (let i = 0; i < 6; i++) {
        inputs.push(`${randInt(1, 60)} ${randInt(2, 6)} ${randInt(1, 30)} ${randInt(1, 30)}\n`);
    }
    for (let i = 0; i < 10; i++) {
        inputs.push(`${randomBig()} ${randInt(2, 6)} ${randInt(1, 1e9)} ${randInt(1, 1e9)}\n`);
    }
    return inputs.map((input) => ({ input, output: "" }));
}

// ---------------------------------------------------------------------------
// D. Ivy's Target -- reroll until inside a window of k+1 faces ending at T,
// then walk up. Window cost B*N/(k+1) + A*k/2 is convex in k.
// ---------------------------------------------------------------------------

function parseTarget(input: string) {
    const [n, s, t, a, b] = input.trim().split(/\s+/).map(Number);
    return { n, s, t, a, b };
}

function solveTarget(input: string): string {
    const { n, s, t, a, b } = parseTarget(input);
    let best = s <= t ? a * (t - s) : Infinity;
    const guess = Math.floor(Math.sqrt((2 * b * n) / a)) - 1;
    for (const raw of [0, t - 1, guess - 1, guess, guess + 1, guess + 2]) {
        const k = Math.min(Math.max(raw, 0), t - 1);
        best = Math.min(best, (b * n) / (k + 1) + (a * k) / 2);
    }
    return fmt(best);
}

/** Value iteration over every face, increments allowed anywhere below N. */
function bruteTarget(input: string): string {
    const { n, s, t, a, b } = parseTarget(input);
    let f = new Array<number>(n + 2).fill(0);
    for (let iter = 0; iter < 20000; iter++) {
        let mean = 0;
        for (let v = 1; v <= n; v++) mean += f[v];
        mean /= n;
        const next = f.slice();
        for (let v = 1; v <= n; v++) {
            if (v === t) continue;
            next[v] = Math.min(v < n ? a + f[v + 1] : Infinity, b + mean);
        }
        f = next;
    }
    return fmt(f[s]);
}

function targetTests(): CpTest[] {
    const inputs = [
        "1 1 1 1 1\n",
        "7 7 7 5 5\n",
        "7 7 1 1000000000 1\n",
        "1000000000 1 1000000000 1 1000000000\n",
        "1000000000 1 1000000000 1000000000 1\n",
        "1000000000 500000000 499999999 1 1\n",
        "1000000000 3 1000000000 1000000000 1000000000\n",
    ];
    for (let i = 0; i < 6; i++) {
        const n = randInt(1, 30);
        inputs.push(`${n} ${randInt(1, n)} ${randInt(1, n)} ${randInt(1, 20)} ${randInt(1, 20)}\n`);
    }
    for (let i = 0; i < 8; i++) {
        const n = randInt(1, 1e9);
        inputs.push(`${n} ${randInt(1, n)} ${randInt(1, n)} ${randInt(1, 1e9)} ${randInt(1, 1e9)}\n`);
    }
    return inputs.map((input) => ({ input, output: "" }));
}

// ---------------------------------------------------------------------------

const SPECS: Record<
    string,
    { solve: (input: string) => string; brute: (input: string) => string; small: () => string; tests: () => CpTest[] }
> = {
    "best-streak": {
        solve: solveStreak,
        brute: bruteStreak,
        small: () => {
            const n = randInt(1, 7);
            const a = Array.from({ length: n }, () => randInt(-20, 20));
            return `${n} ${randInt(-5, 5)}\n${a.join(" ")}\n`;
        },
        tests: streakTests,
    },
    "dice-game": {
        solve: solveDice,
        brute: bruteDice,
        small: () => `${randInt(1, 15)}\n`,
        tests: diceTests,
    },
    "count-down": {
        solve: solveCount,
        brute: bruteCount,
        small: () => `${randInt(1, 80)} ${randInt(2, 6)} ${randInt(1, 50)} ${randInt(1, 50)}\n`,
        tests: countTests,
    },
    target: {
        solve: solveTarget,
        brute: bruteTarget,
        small: () => {
            const n = randInt(1, 6);
            return `${n} ${randInt(1, n)} ${randInt(1, n)} ${randInt(1, 30)} ${randInt(1, 30)}\n`;
        },
        tests: targetTests,
    },
};

function same(problemChecker: "exact" | "float", got: string, want: string): boolean {
    if (problemChecker === "exact") return got.trim() === want.trim();
    return close(Number(got), Number(want));
}

let failed = false;
const written: [string, CpTest[]][] = [];

for (const problem of CP_PROBLEMS) {
    const spec = SPECS[problem.id];
    assert.ok(spec, `No reference for ${problem.id}`);

    const rounds = problem.id === "target" ? 300 : 2000;
    for (let i = 0; i < rounds; i++) {
        const input = spec.small();
        const got = spec.solve(input);
        const want = spec.brute(input);
        if (!same(problem.checker, got, want)) {
            console.error(`${problem.id}: reference disagrees with brute force on\n${input}got ${got}want ${want}`);
            process.exit(1);
        }
    }

    const samples: CpTest[] = [];
    for (const sample of problem.samples) {
        const output = spec.solve(sample.input);
        if (output !== sample.output) {
            failed = true;
            console.error(
                `${problem.id}: sample ${JSON.stringify(sample.input)} shows ${JSON.stringify(sample.output)}, reference gives ${JSON.stringify(output)}`,
            );
        }
        samples.push({ input: sample.input, output });
    }

    const tests = [...samples, ...spec.tests()].map((test) => ({
        ...test,
        output: spec.solve(testInput(test)),
    }));
    written.push([problem.id, tests]);
}

if (failed) {
    console.error("\nFix the samples in lib/cp/problems.ts; nothing was written.");
    process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [id, tests] of written) {
    writeFileSync(join(OUT_DIR, `${id}.json`), `${JSON.stringify(tests, null, 1)}\n`);
    console.log(`${id}: ${tests.length} tests`);
}
