// Port-fidelity checks for the Make the Market game core.
//
// The engine was copied in from the standalone app; these assertions are
// carried over from its own test file (makethemarket/tests/engine.test.ts)
// so that the copy is known not to have changed behaviour. This repo has no
// test framework, so they live as an ops script. Run with:
//
//   npm run check:mtm
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
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
import { MTM_PRESET_ORDER, configFor, type MtmPreset } from "../lib/game/mtm/presets";
import { MTM_TOTAL_ACTIONS, replay, type MtmAction } from "../lib/game/mtm/replay";
import { projectSettled, projectState } from "../lib/game/mtm/project";
import {
    createSession,
    isComplete,
    open as openSession,
    seal,
    withAction,
    MtmSessionError,
} from "../lib/game/mtm/session";

// session.ts refuses to run without a key, by design. These checks only
// exercise the seal/open round-trip locally, so an ephemeral one is fine --
// this is NOT a fallback in the app itself, which still fails loudly.
process.env.MTM_SESSION_SECRET ??= randomBytes(32).toString("hex");

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

function actionsFrom(seed: number, n: number): MtmAction[] {
    const pool: MtmAction[] = ["buy", "sell", "pass"];
    return Array.from({ length: n }, (_, i) => pool[(seed + i * 7) % 3]!);
}

// --- server replay: the basis for trusting an emailed score ----------------

check("replay is reproducible: same inputs, same P&L", () => {
    for (const preset of MTM_PRESET_ORDER) {
        for (let seed = 1; seed <= 25; seed++) {
            const actions = actionsFrom(seed, MTM_TOTAL_ACTIONS);
            const a = replay(seed, preset, actions);
            const b = replay(seed, preset, actions);
            assert.equal(finalPnl(a), finalPnl(b));
            assert.equal(trueValue(a), trueValue(b));
            assert.deepEqual(a.quotes, b.quotes);
        }
    }
});

check("draw count is independent of the choice made (the core invariant)", () => {
    // Changing one decision must not shift the random stream, or the server's
    // quotes would diverge from the ones the player actually saw.
    for (let seed = 1; seed <= 40; seed++) {
        const preset: MtmPreset = "normal";
        const step = seed % MTM_TOTAL_ACTIONS;
        const base = actionsFrom(seed, MTM_TOTAL_ACTIONS);

        const variants = (["buy", "sell", "pass"] as MtmAction[]).map((a) => {
            const copy = [...base];
            copy[step] = a;
            return copy;
        });

        const settles = variants.map((v) => trueValue(replay(seed, preset, v)));
        assert.equal(new Set(settles).size, 1, `settlement shifted at seed ${seed}`);

        const priced = variants.map((v) =>
            JSON.stringify(replay(seed, preset, v.slice(0, step)).quotes)
        );
        assert.equal(new Set(priced).size, 1, `quotes diverged at seed ${seed}`);
    }
});

check("advance is lazy: four decisions sit pre-flip", () => {
    const seed = 99;
    const four = actionsFrom(seed, 4);
    const held = replay(seed, "normal", four);
    assert.equal(held.revealed, 0, "should not have flipped yet");
    assert.ok(held.activeMaker >= 4, "round should be fully answered");

    const flipped = replay(seed, "normal", four, { advanceCompletedRound: true });
    assert.equal(flipped.revealed, 1);
    assert.equal(replay(seed, "normal", actionsFrom(seed, 5)).round, 1);
});

// --- redaction: what the browser is allowed to see -------------------------

check("projected in-flight state leaks no hidden information", () => {
    for (const preset of MTM_PRESET_ORDER) {
        for (let n = 0; n < MTM_TOTAL_ACTIONS; n++) {
            const state = replay(7, preset, actionsFrom(7, n));
            const projected = projectState(state, preset);
            const wire = JSON.stringify(projected);

            for (const maker of state.makers) {
                assert.ok(
                    !wire.includes(JSON.stringify(maker.card)),
                    `maker card leaked at n=${n} preset=${preset}`
                );
            }
            for (let i = state.revealed; i < state.community.length; i++) {
                assert.ok(
                    !wire.includes(JSON.stringify(state.community[i]!)),
                    `hidden community card leaked at n=${n}`
                );
            }

            assert.ok(!wire.includes("privateFair"), "privateFair leaked");
            assert.ok(!wire.includes('"mid"'), "mid leaked");
            assert.ok(!wire.includes("seed"), "seed leaked");

            projected.quotes.forEach((q, i) => {
                if (i > projected.activeMaker) assert.equal(q, null, `quote ${i} read ahead`);
            });

            if (projected.hardMode) {
                assert.equal(projected.position, undefined);
                assert.equal(projected.cash, undefined);
                assert.equal(projected.markPnl, undefined);
                assert.equal(projected.trades, undefined);
            }
            assert.equal(projected.fairEstimate !== undefined, preset === "training");
        }
    }
});

check("settled projection reveals everything and matches the engine", () => {
    const state = replay(5, "hard", actionsFrom(5, MTM_TOTAL_ACTIONS));
    const settled = projectSettled(state, "hard");
    assert.equal(settled.finalPnl, finalPnl(state));
    assert.equal(settled.trueValue, trueValue(state));
    assert.equal(settled.makerResults.length, 4);
    assert.equal(settled.settledCommunity.length, 4);
    assert.notEqual(settled.position, undefined, "hard mode must reveal the book at settlement");
});

// --- the sealed session: why a score cannot be edited ----------------------

check("a sealed token round-trips and hides the seed", () => {
    const session = createSession("expert");
    const token = seal(session);
    assert.ok(!token.includes(String(session.seed)), "seed visible in the token");
    // base64url-decoding the token must not reveal the payload either.
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    assert.ok(!decoded.includes("seed"), "payload is not encrypted");
    assert.ok(!decoded.includes("expert"), "payload is not encrypted");
    assert.deepEqual(openSession(token), session);
});

check("any edit to a token is rejected", () => {
    const token = seal(createSession("normal"));
    const raw = Buffer.from(token, "base64url");

    // Flip one bit in each region: nonce, auth tag, and ciphertext.
    for (const index of [0, 13, raw.length - 1]) {
        const tampered = Buffer.from(raw);
        tampered[index] ^= 0x01;
        assert.throws(
            () => openSession(tampered.toString("base64url")),
            MtmSessionError,
            `tampering at byte ${index} was not caught`
        );
    }

    assert.throws(() => openSession("not-a-token"), MtmSessionError);
    assert.throws(() => openSession(""), MtmSessionError);
    assert.throws(() => openSession(undefined), MtmSessionError);
});

check("out-of-order and duplicate moves are refused", () => {
    let session = createSession("normal");
    session = withAction(session, 0, "buy");
    // Replaying index 0 -- a double-clicked Buy -- must not fill twice.
    assert.throws(() => withAction(session, 0, "buy"), MtmSessionError);
    assert.throws(() => withAction(session, 5, "buy"), MtmSessionError);
    session = withAction(session, 1, "pass");
    assert.equal(session.actions.length, 2);
});

check("a hand only reports complete after all 20 decisions", () => {
    let session = createSession("normal");
    for (let i = 0; i < MTM_TOTAL_ACTIONS; i++) {
        assert.equal(isComplete(session), false, `complete too early at ${i}`);
        session = withAction(session, i, "pass");
    }
    assert.equal(isComplete(session), true);
    // And one more decision is impossible.
    assert.throws(() => withAction(session, MTM_TOTAL_ACTIONS, "buy"), MtmSessionError);
});

check("the emailed score is derived, never supplied", () => {
    // Two players submitting the same decisions on the same deal must get the
    // same number, and it must equal the engine's own accounting.
    const session = createSession("normal");
    const actions = actionsFrom(3, MTM_TOTAL_ACTIONS);
    const state = replay(session.seed, session.preset, actions);
    assert.equal(finalPnl(state), state.cash + state.position * trueValue(state));
    assert.equal(finalPnl(replay(session.seed, session.preset, actions)), finalPnl(state));
});

console.log(`\n${checks} checks passed.`);
