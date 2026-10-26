import type { DdPreset } from "./presets";

// Fixed seed sets for the contests, produced by scripts/pick-dd-seeds.mts.
//
// Everyone plays the same contracts AND the same realisations, so the ranking
// is skill rather than luck and re-rolling would gain nothing. Regenerate with
// `npm run seeds:dd` if a contract's parameters change -- the constraints the
// script enforces (notably: a geometric reveal must show no success, so the
// memorylessness lesson actually fires) are documented there.
//
// The tradeoff this buys, and it is a real one: identical deals mean a student
// who plays late can be told the outcomes by one who played early. The defence
// is the one-attempt lock plus holding the midpoint leaderboard until the
// contest closes. Say so to the students rather than pretending otherwise.

export const CONTEST_SEEDS: readonly number[] = [
    1000003, 2000006, 3015847, 4015850, 5000015, 6000018, 7000021,
];

export const MIDPOINT_SEEDS: readonly number[] = [
    1007922, 2000006, 3015847, 4000012, 5000015, 6000018, 7000021,
];

/** Practice deals fresh seeds every run; the contests are fixed. */
export function fixedSeedsFor(preset: DdPreset): readonly number[] | null {
    if (preset === "contest") return CONTEST_SEEDS;
    if (preset === "midpoint") return MIDPOINT_SEEDS;
    return null;
}
