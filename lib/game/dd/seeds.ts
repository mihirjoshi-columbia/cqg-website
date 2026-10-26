// The fixed seed set the homework is played on, produced by
// scripts/pick-dd-seeds.mts.
//
// Everyone plays the same contracts AND the same realisations, so the ranking
// is skill rather than luck and re-rolling would gain nothing. Regenerate with
// `npm run seeds:dd` if a contract's parameters change -- the constraints the
// script enforces (notably: a geometric reveal must show no success, so the
// memorylessness lesson actually fires) are documented there.
//
// The tradeoff this buys, and it is a real one: identical deals mean a student
// who plays late can be told the outcomes by one who played early. The defence
// is the one-attempt lock, recorded when the run is dealt. Say so to the
// students rather than pretending otherwise.

export const HOMEWORK_SEEDS: readonly number[] = [
    1000003, 2000006, 3015847, 4015850, 5000015, 6000018, 7000021,
];

/** There is one seed set, so this takes no preset. */
export function seedsFor(): readonly number[] {
    return HOMEWORK_SEEDS;
}
