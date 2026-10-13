// Port-fidelity checks for the Make the Market game core.
//
// The engine was copied in from the standalone app; these assertions are
// carried over from its own test file (makethemarket/tests/engine.test.ts)
// so that the copy is known not to have changed behaviour. This repo has no
// test framework, so they live as an ops script. Run with:
//
//   npm run check:mtm
import assert from "node:assert/strict";
import { buildDeck, DECK_SUM, fairValue, poolMean } from "../lib/game/mtm/deck";
import {
    advance,
    finalPnl,
    pass,
    roundComplete,
    startGame,
    trade,
    trueValue,
    updateCostBasis,
    type GameState,
} from "../lib/game/mtm/engine";
import { MTM_PRESET_ORDER, configFor } from "../lib/game/mtm/presets";

let checks = 0;
function check(name: string, fn: () => void) {
    fn();
    checks++;
    console.log(`  ok  ${name}`);
}

/** Deterministic generator so a failure is reproducible. */
function lcg(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

check("deck is 39 cards and black/red values sum to 910", () => {
    assert.equal(buildDeck().length, 39);
    assert.equal(DECK_SUM, 910);
});

check("fair value with nothing revealed is own card plus 8 pool means", () => {
    const deck = buildDeck();
    const own = deck[0]!;
    const community = [deck[1]!, deck[2]!, deck[3]!, deck[4]!];
    assert.equal(fairValue(own, community, 0), own.value + 8 * poolMean([own]));
});

check("cost basis blends, holds and re-bases", () => {
    let b = updateCostBasis(0, 0, "buy", 1, 100);
    assert.deepEqual(b, { position: 1, avgEntry: 100 });
    b = updateCostBasis(b.position, b.avgEntry, "buy", 1, 200);
    assert.deepEqual(b, { position: 2, avgEntry: 150 });
    b = updateCostBasis(b.position, b.avgEntry, "sell", 1, 400);
    assert.deepEqual(b, { position: 1, avgEntry: 150 }); // reducing keeps the basis
    b = updateCostBasis(b.position, b.avgEntry, "sell", 1, 400);
    assert.deepEqual(b, { position: 0, avgEntry: 0 }); // flat resets
    assert.deepEqual(updateCostBasis(1, 150, "sell", 3, 90), { position: -2, avgEntry: 90 });
});

check("a full five-round hand settles on the true nine-card sum", () => {
    for (const preset of MTM_PRESET_ORDER) {
        const random = lcg(42);
        let state: GameState = startGame(configFor(preset), random);

        for (let round = 0; round < 5; round++) {
            assert.equal(state.round, round);
            for (let i = 0; i < 4; i++) {
                state =
                    i % 2 === 0
                        ? trade(state, i, i % 4 === 0 ? "buy" : "sell", random)
                        : pass(state, i, random);
            }
            assert.ok(roundComplete(state));
            state = advance(state, random);
        }

        assert.equal(state.phase, "done");
        assert.equal(state.revealed, 4);
        assert.equal(finalPnl(state), state.cash + state.position * trueValue(state));

        // Maker inventory is the mirror image of the player's position.
        const inventory = state.makers.reduce((sum, m) => sum + m.inventory, 0);
        assert.equal(inventory + state.position, 0);
    }
});

check("quotes stay two-sided with the ask above the bid", () => {
    for (const preset of MTM_PRESET_ORDER) {
        const random = lcg(7);
        let state: GameState = startGame(configFor(preset), random);
        for (let round = 0; round < 5; round++) {
            for (const q of state.quotes) assert.ok(q.ask > q.bid, `${q.ask} <= ${q.bid}`);
            for (let i = 0; i < 4; i++) state = pass(state, i, random);
            state = advance(state, random);
        }
    }
});

check("each preset resolves to the config the engine actually applies", () => {
    // The engine forces the estimate off whenever hard or expert is set, so a
    // preset must not claim to show it and then not.
    for (const preset of MTM_PRESET_ORDER) {
        const config = configFor(preset);
        const state = startGame(config, lcg(1));
        if (config.hardMode || config.expertMode) {
            assert.equal(state.config.showEstimate, false, `${preset} should hide the estimate`);
        } else {
            assert.equal(state.config.showEstimate, config.showEstimate);
        }
    }
});

console.log(`\n${checks} checks passed.`);
