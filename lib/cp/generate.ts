// Builds a large test input from its recipe.
//
// Shared by scripts/gen-cp-tests.mts, which computes the expected output, and
// the browser, which rebuilds the same input before judging. Storing a seed
// instead of a 3 MB array keeps the test files small; the cost is that this
// function must stay byte-for-byte deterministic, so changing it means
// re-running the script.
import { mulberry32 } from "../game/prng";
import type { CpTest, StreakGen } from "./problems";

function randInt(random: () => number, lo: number, hi: number): number {
    return lo + Math.floor(random() * (hi - lo + 1));
}

export function buildStreakInput(gen: StreakGen): string {
    const random = mulberry32(gen.seed);
    const x = gen.x ?? randInt(random, -100, 100);
    const a = new Array<number>(gen.n);
    for (let i = 0; i < gen.n; i++) {
        a[i] =
            gen.pattern === "alternating"
                ? i % 2 === 0
                    ? gen.hi
                    : gen.lo
                : randInt(random, gen.lo, gen.hi);
    }
    return `${gen.n} ${x}\n${a.join(" ")}\n`;
}

export function testInput(test: CpTest): string {
    if (test.input !== undefined) return test.input;
    if (test.gen) return buildStreakInput(test.gen);
    throw new Error("Test has neither an input nor a recipe.");
}
