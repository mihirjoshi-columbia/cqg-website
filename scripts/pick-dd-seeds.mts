// Picks the fixed seed set a Distribution Desk contest is played on.
//
// Everyone is dealt the same contracts AND the same realisations, so the
// ranking contains no luck. That makes the seeds a teaching decision rather
// than a random one, and this script makes it explicitly:
//
//  1. A contract whose reveal is a GEOMETRIC leg must show no success in the
//     revealed prefix. Otherwise the contract resolves at the reveal and the
//     memorylessness lesson -- the reveal moves the price but not the risk --
//     never gets a chance to fire. It is the single most discriminating
//     moment in the set, so it is not left to chance.
//  2. Settlement must land within 1.5 SD of the prior fair, so no one
//     contract's freak outcome decides the leaderboard.
//
// Run with:  npm run seeds:dd
import { mulberry32 } from "../lib/game/prng";
import {
    afterReveal,
    moments,
    nothingSeen,
    realise,
    type Contract,
} from "../lib/game/dd/contracts";
import { DD_PRESET_ORDER, contractsFor } from "../lib/game/dd/presets";

const MAX_SETTLEMENT_SDS = 1.5;
const SEARCH_LIMIT = 200_000;

function acceptable(contract: Contract, seed: number): boolean {
    const realisation = realise(contract, mulberry32(seed));
    const prior = moments(contract, realisation, nothingSeen(contract));

    if (prior.sd > 0) {
        const z = Math.abs(realisation.settlement - prior.fair) / prior.sd;
        if (z > MAX_SETTLEMENT_SDS) return false;
    }

    const revealLeg = contract.legs[contract.reveal.legIndex]!;
    if (revealLeg.kind === "geometric") {
        const prefix = realisation.units[contract.reveal.legIndex]!.slice(0, contract.reveal.units);
        if (prefix.includes(1)) return false;
        // And the post-reveal SD must be unchanged, which is the whole point.
        const post = moments(contract, realisation, afterReveal(contract));
        if (Math.abs(post.sd - prior.sd) > 1e-9) return false;
    }

    return true;
}

for (const preset of DD_PRESET_ORDER) {
    const contracts = contractsFor();
    const seeds: number[] = [];

    contracts.forEach((contract, index) => {
        // Start each contract's search from a different place so the set is
        // not a run of consecutive integers.
        let seed = 1_000_003 * (index + 1);
        let tried = 0;
        while (!acceptable(contract, seed)) {
            seed = (seed + 7919) >>> 0;
            if (++tried > SEARCH_LIMIT) throw new Error(`no seed found for ${contract.id}`);
        }
        seeds.push(seed);
    });

    console.log(`\n${preset}:`);
    console.log(`export const HOMEWORK_SEEDS: readonly number[] = [${seeds.join(", ")}];`);
    contracts.forEach((contract, i) => {
        const realisation = realise(contract, mulberry32(seeds[i]!));
        const prior = moments(contract, realisation, nothingSeen(contract));
        const post = moments(contract, realisation, afterReveal(contract));
        console.log(
            `  ${contract.id.padEnd(32)} seed ${String(seeds[i]).padStart(9)}` +
                `  fair ${prior.fair.toFixed(1).padStart(6)} -> ${post.fair.toFixed(1).padStart(6)}` +
                `  sd ${prior.sd.toFixed(1).padStart(5)} -> ${post.sd.toFixed(1).padStart(5)}` +
                `  settles ${realisation.settlement.toFixed(1).padStart(7)}`
        );
    });
}
