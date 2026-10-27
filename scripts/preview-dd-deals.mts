// Prints a few generated Distribution Desk deals, with the answers.
//
// Replaces the old scripts/pick-dd-seeds.mts, which existed to hand-pick ONE
// deal that everybody played. Deals are random per run now (lib/game/dd/deal.ts
// explains why), so there is nothing to pick -- but you still want to be able
// to look at what the generator is producing before a session, because the
// numbers are supposed to be doable in your head under a clock.
//
// Run with:  npm run deals:dd [count]
import { mulberry32 } from "../lib/game/prng";
import { afterReveal, moments, nothingSeen, realise } from "../lib/game/dd/contracts";
import { makeDeal } from "../lib/game/dd/deal";

const count = Math.max(1, Math.min(20, Number.parseInt(process.argv[2] ?? "3", 10) || 3));

for (let d = 0; d < count; d++) {
    // Arbitrary seeds, spread out so consecutive runs of this script show
    // genuinely different sets rather than neighbours.
    const dealSeed = (1_000_003 * (d + 1) + 7_919) >>> 0;
    const { contracts, seeds } = makeDeal(dealSeed);

    console.log(`\n=== deal ${dealSeed} ===`);
    contracts.forEach((contract, i) => {
        const realisation = realise(contract, mulberry32(seeds[i]!));
        const prior = moments(contract, realisation, nothingSeen(contract));
        const post = moments(contract, realisation, afterReveal(contract));

        console.log(`\n  ${i + 1}. ${contract.description}`);
        console.log(
            `     fair ${prior.fair.toFixed(1)} -> ${post.fair.toFixed(1)}` +
                `   sd ${prior.sd.toFixed(1)} -> ${post.sd.toFixed(1)}` +
                `   settles ${realisation.settlement.toFixed(1)}` +
                `   reveals ${contract.reveal.units} unit(s) of leg ${contract.reveal.legIndex}`
        );
    });
}

console.log("");
