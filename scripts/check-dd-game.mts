// Checks for the Distribution Desk game core.
//
// This repo has no test framework, so these live as an ops script alongside
// scripts/check-mtm-game.mts. Run with:
//
//   npm run check:dd
//
// The distribution maths is the part most worth checking: a wrong variance
// formula would not crash anything, it would just quietly make the game
// unfair and teach the wrong lesson. Every closed-form mean and SD here is
// cross-checked against Monte Carlo, including the POSTERIOR moments after a
// reveal, which is where the subtle cases (memorylessness, variance addition)
// live.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mulberry32 } from "../lib/game/prng";
import {
    afterReveal,
    legUnits,
    legValue,
    moments,
    nothingSeen,
    realise,
    type Contract,
    type LegUnits,
} from "../lib/game/dd/contracts";
import { MIDPOINT_CONTRACTS, WEEK3_CONTRACTS } from "../lib/game/dd/library";
import {
    applyQuote,
    contractPnl,
    DdQuoteError,
    momentsAt,
    openContract,
    validateQuote,
} from "../lib/game/dd/engine";
import { DD_PRESET_ORDER, configFor, contractsFor } from "../lib/game/dd/presets";
import { replay } from "../lib/game/dd/replay";
import { score } from "../lib/game/dd/scoring";
import { projectRun } from "../lib/game/dd/project";
import { CONTEST_SEEDS, MIDPOINT_SEEDS, fixedSeedsFor } from "../lib/game/dd/seeds";
import {
    DdSessionError,
    createSession,
    isComplete,
    open as openSession,
    seal,
    withQuote,
} from "../lib/game/dd/session";
import { DD_STAGES, type Quote } from "../lib/game/dd/types";

// session.ts refuses to run without a key, by design. These checks only
// exercise the seal/open round-trip locally, so an ephemeral one is fine --
// this is NOT a fallback in the app itself, which still fails loudly.
process.env.DD_SESSION_SECRET ??= randomBytes(32).toString("hex");

const ALL_CONTRACTS = [...WEEK3_CONTRACTS, ...MIDPOINT_CONTRACTS];

let checks = 0;
function check(label: string, fn: () => void) {
    fn();
    checks++;
    console.log(`  ok  ${label}`);
}

// ---------------------------------------------------------------------------
// Distribution maths
// ---------------------------------------------------------------------------

const MC_RUNS = 120_000;

function monteCarlo(sample: () => number, runs = MC_RUNS) {
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < runs; i++) {
        const v = sample();
        sum += v;
        sumSq += v * v;
    }
    const mean = sum / runs;
    return { mean, sd: Math.sqrt(Math.max(0, sumSq / runs - mean * mean)) };
}

check("prior fair and SD match Monte Carlo for every contract", () => {
    for (const contract of ALL_CONTRACTS) {
        const random = mulberry32(4242);
        const mc = monteCarlo(() => realise(contract, random).settlement);
        const prior = moments(contract, realise(contract, mulberry32(7)), nothingSeen(contract));

        assert.ok(
            Math.abs(mc.mean - prior.fair) < 0.04 * prior.sd,
            `${contract.id}: fair ${prior.fair} vs MC ${mc.mean.toFixed(2)}`
        );
        assert.ok(
            Math.abs(mc.sd - prior.sd) / prior.sd < 0.03,
            `${contract.id}: SD ${prior.sd} vs MC ${mc.sd.toFixed(2)}`
        );
    }
});

/**
 * Resamples only the units a player has NOT seen, holding the revealed prefix
 * fixed. That is exactly the conditional distribution the posterior claims to
 * describe, so it is the honest way to check it.
 */
function resampleUnrevealed(
    contract: Contract,
    units: LegUnits[],
    seen: number[],
    random: () => number
): number {
    let total = 0;
    contract.legs.forEach((leg, i) => {
        const kept = units[i]!.slice(0, seen[i] ?? 0);
        const fresh = realise({ ...contract, legs: [leg] }, random);
        const tail = fresh.units[0]!.slice(seen[i] ?? 0, legUnits(leg));
        total += legValue(leg, [...kept, ...tail]);
    });
    return total;
}

check("posterior fair and SD after the reveal match conditional Monte Carlo", () => {
    for (const contract of ALL_CONTRACTS) {
        const realisation = realise(contract, mulberry32(99));
        const seen = afterReveal(contract);
        const posterior = moments(contract, realisation, seen);

        const random = mulberry32(1234);
        const mc = monteCarlo(
            () => resampleUnrevealed(contract, realisation.units, seen, random),
            60_000
        );

        const scale = Math.max(posterior.sd, 1);
        assert.ok(
            Math.abs(mc.mean - posterior.fair) < 0.05 * scale,
            `${contract.id}: posterior fair ${posterior.fair.toFixed(2)} vs MC ${mc.mean.toFixed(2)}`
        );
        if (posterior.sd > 0) {
            assert.ok(
                Math.abs(mc.sd - posterior.sd) / posterior.sd < 0.04,
                `${contract.id}: posterior SD ${posterior.sd.toFixed(2)} vs MC ${mc.sd.toFixed(2)}`
            );
        }
    }
});

check("a geometric reveal moves the fair but leaves the SD untouched", () => {
    // Memorylessness. This is the single most discriminating moment in the
    // game, so it is asserted directly rather than inferred from the MC above.
    for (const contract of ALL_CONTRACTS) {
        const leg = contract.legs[contract.reveal.legIndex]!;
        if (leg.kind !== "geometric") continue;

        // A seed whose revealed prefix contains no success.
        let seed = 1;
        let realisation = realise(contract, mulberry32(seed));
        while (realisation.units[contract.reveal.legIndex]!.slice(0, contract.reveal.units).includes(1)) {
            realisation = realise(contract, mulberry32(++seed));
        }

        const prior = moments(contract, realisation, nothingSeen(contract));
        const post = moments(contract, realisation, afterReveal(contract));

        assert.ok(
            Math.abs(post.sd - prior.sd) < 1e-9,
            `${contract.id}: SD moved ${prior.sd} -> ${post.sd} across a geometric reveal`
        );
        const expectedShift = leg.multiplier * contract.reveal.units;
        assert.ok(
            Math.abs(post.fair - prior.fair - expectedShift) < 1e-9,
            `${contract.id}: fair shifted by ${post.fair - prior.fair}, expected ${expectedShift}`
        );
    }
});

check("variances add across independent legs, standard deviations do not", () => {
    const composites = ALL_CONTRACTS.filter((c) => c.legs.length > 1);
    assert.ok(composites.length >= 2, "expected at least two composite contracts");

    for (const contract of composites) {
        const realisation = realise(contract, mulberry32(321));
        const whole = moments(contract, realisation, nothingSeen(contract));

        let sumOfVariances = 0;
        let sumOfSds = 0;
        contract.legs.forEach((leg, i) => {
            const single: Contract = { ...contract, legs: [leg], reveal: { legIndex: 0, units: 0 } };
            const legMoments = moments(single, { units: [realisation.units[i]!], settlement: 0 }, [0]);
            sumOfVariances += legMoments.variance;
            sumOfSds += legMoments.sd;
        });

        assert.ok(
            Math.abs(whole.variance - sumOfVariances) < 1e-6,
            `${contract.id}: variance ${whole.variance} != sum of leg variances ${sumOfVariances}`
        );
        assert.ok(
            whole.sd < sumOfSds - 1e-6,
            `${contract.id}: SD should be strictly below the sum of leg SDs`
        );
    }
});

// ---------------------------------------------------------------------------
// Engine determinism
// ---------------------------------------------------------------------------

check("the whole realisation is drawn before the first quote", () => {
    for (const contract of WEEK3_CONTRACTS) {
        const config = configFor("contest");
        let draws = 0;
        const base = mulberry32(55);
        const counting = () => {
            draws++;
            return base();
        };

        const state = openContract(contract, config, counting);
        const afterOpen = draws;

        // Every reachable sequence of quotes must consume exactly zero further
        // draws, which is what makes a replay reproduce what the player saw.
        const { fair, sd } = momentsAt(state, 0);
        for (const half of [1, sd / 2, sd * 3]) {
            let s = state;
            for (let stage = 0; stage < DD_STAGES; stage++) {
                s = applyQuote(s, { bid: fair - half, ask: fair + half }, config);
            }
            assert.equal(draws, afterOpen, `${contract.id}: quoting consumed PRNG draws`);
        }
    }
});

check("draw count is independent of the quote (the core invariant)", () => {
    const config = configFor("contest");
    const counts = [0.5, 1, 4].map((mult) => {
        let draws = 0;
        const base = mulberry32(909);
        const random = () => {
            draws++;
            return base();
        };
        let state = openContract(WEEK3_CONTRACTS[0]!, config, random);
        const { fair, sd } = momentsAt(state, 0);
        for (let stage = 0; stage < DD_STAGES; stage++) {
            state = applyQuote(state, { bid: fair - mult * sd, ask: fair + mult * sd }, config);
        }
        return draws;
    });
    assert.equal(new Set(counts).size, 1, `draw counts differed: ${counts.join(", ")}`);
});

check("replay is reproducible: same seeds and quotes, same P&L", () => {
    const seeds = [...CONTEST_SEEDS];
    const quotes: Quote[] = [];
    const contracts = contractsFor("contest");
    for (let i = 0; i < contracts.length * DD_STAGES; i++) {
        quotes.push({ bid: 100 + i, ask: 140 + i });
    }

    const a = score(replay(seeds, "contest", quotes));
    const b = score(replay(seeds, "contest", quotes));
    assert.deepEqual(a, b);
    assert.ok(Number.isFinite(a.totalPnl));
});

check("a partial run exposes exactly one live contract", () => {
    const seeds = [...CONTEST_SEEDS];
    const run = replay(seeds, "contest", [{ bid: 130, ask: 150 }]);
    assert.equal(run.complete, false);
    assert.equal(run.contracts.length, 1);
    assert.equal(run.contracts[0]!.stage, 1);
    assert.equal(run.contracts[0]!.settled, false);
});

check("a full run settles every contract", () => {
    const contracts = contractsFor("contest");
    const quotes: Quote[] = Array.from({ length: contracts.length * DD_STAGES }, () => ({
        bid: 0,
        ask: 1000,
    }));
    const run = replay([...CONTEST_SEEDS], "contest", quotes);
    assert.equal(run.complete, true);
    assert.equal(run.contracts.length, contracts.length);
    assert.ok(run.contracts.every((c) => c.settled));
});

check("settlement P&L is cash plus inventory marked at the settlement price", () => {
    const config = configFor("contest");
    let state = openContract(WEEK3_CONTRACTS[0]!, config, mulberry32(17));
    const { fair, sd } = momentsAt(state, 0);
    for (let stage = 0; stage < DD_STAGES; stage++) {
        state = applyQuote(state, { bid: fair - sd / 2, ask: fair + sd / 2 }, config);
    }
    assert.equal(
        contractPnl(state),
        state.cash + state.inventory * state.realisation.settlement
    );
});

// ---------------------------------------------------------------------------
// Quote validation and the flow model
// ---------------------------------------------------------------------------

check("a crossed or zero-width quote is refused", () => {
    assert.throws(() => validateQuote({ bid: 100, ask: 100 }), DdQuoteError);
    assert.throws(() => validateQuote({ bid: 120, ask: 100 }), DdQuoteError);
    assert.throws(() => validateQuote({ bid: Number.NaN, ask: 100 }), DdQuoteError);
    assert.throws(() => validateQuote({ bid: 0, ask: 1e9 }), DdQuoteError);
    assert.deepEqual(validateQuote({ bid: 99.994, ask: 120.006 }), { bid: 99.99, ask: 120.01 });
});

check("inventory never breaches the position limit", () => {
    for (const preset of DD_PRESET_ORDER) {
        const config = configFor(preset);
        for (const contract of contractsFor(preset)) {
            for (let seed = 0; seed < 40; seed++) {
                let state = openContract(contract, config, mulberry32(seed));
                // A one-sided market invites maximum directional flow.
                for (let stage = 0; stage < DD_STAGES; stage++) {
                    const { fair } = momentsAt(state, state.stage);
                    state = applyQuote(state, { bid: fair - 0.5, ask: fair + 0.5 }, config);
                }
                assert.ok(
                    Math.abs(state.inventory) <= config.positionLimit,
                    `${contract.id}: inventory ${state.inventory} exceeded ${config.positionLimit}`
                );
            }
        }
    }
});

check("expected P&L peaks at a width near one SD, and over-wide earns nothing", () => {
    // This is the property the whole game rests on: it is what makes the
    // distribution maths and the quoting the same skill. If this check fails,
    // a player can score well without ever estimating a variance.
    const multiples = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
    const RUNS = 1200;

    for (const preset of DD_PRESET_ORDER) {
        const config = configFor(preset);
        const contracts = contractsFor(preset);

        const curve = multiples.map((mult) => {
            let total = 0;
            for (const contract of contracts) {
                const scale = Math.max(
                    1,
                    moments(contract, realise(contract, mulberry32(3)), nothingSeen(contract)).sd
                );
                for (let r = 0; r < RUNS; r++) {
                    let state = openContract(contract, config, mulberry32(r * 7919 + 13));
                    for (let stage = 0; stage < DD_STAGES; stage++) {
                        const { fair, sd } = momentsAt(state, state.stage);
                        const half = Math.max(0.5, (mult * sd) / 2);
                        state = applyQuote(state, { bid: fair - half, ask: fair + half }, config);
                    }
                    total += contractPnl(state) / scale;
                }
            }
            return total / (RUNS * contracts.length);
        });

        let bestIndex = 0;
        curve.forEach((v, i) => {
            if (v > curve[bestIndex]!) bestIndex = i;
        });
        const best = curve[bestIndex]!;

        assert.ok(
            multiples[bestIndex]! >= 0.75 && multiples[bestIndex]! <= 1.5,
            `${preset}: best width was ${multiples[bestIndex]}x SD, expected 0.75x-1.5x`
        );
        assert.ok(best > 0, `${preset}: even the best width loses money`);
        assert.ok(
            curve[0]! < best * 0.6,
            `${preset}: quoting 0.25x SD is not punished enough (${curve[0]!.toFixed(2)} vs ${best.toFixed(2)})`
        );
        assert.ok(
            curve[curve.length - 1]! < best * 0.3,
            `${preset}: quoting 3x SD is not punished enough (${curve[curve.length - 1]!.toFixed(2)} vs ${best.toFixed(2)})`
        );
    }
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

check("a well-calibrated run outscores a careless one on every sub-score", () => {
    const seeds = [...CONTEST_SEEDS];
    const contracts = contractsFor("contest");

    function runWith(build: (fair: number, sd: number) => Quote) {
        const quotes: Quote[] = [];
        for (let i = 0; i < contracts.length; i++) {
            for (let stage = 0; stage < DD_STAGES; stage++) {
                const partial = replay(seeds, "contest", quotes);
                const live = partial.contracts[partial.contracts.length - 1]!;
                const { fair, sd } = momentsAt(live, live.stage);
                quotes.push(build(fair, sd));
            }
        }
        return score(replay(seeds, "contest", quotes));
    }

    const sharp = runWith((fair, sd) => ({ bid: fair - sd / 2, ask: fair + sd / 2 }));
    // Mispriced, mis-sized, and blind to the reveal.
    const sloppy = runWith((fair, sd) => ({ bid: fair - sd * 2.5, ask: fair + sd * 0.4 }));

    assert.ok(sharp.pricing > sloppy.pricing, "pricing sub-score did not separate the runs");
    assert.ok(
        sharp.widthCalibration > sloppy.widthCalibration,
        "width calibration sub-score did not separate the runs"
    );
    assert.ok(sharp.totalPnl > sloppy.totalPnl, "P&L did not separate the runs");
    for (const value of [sharp.pricing, sharp.widthCalibration, sharp.revealResponse, sharp.riskControl]) {
        assert.ok(value >= 0 && value <= 1, `sub-score ${value} out of range`);
    }
});

check("tightening across a geometric reveal is marked down", () => {
    // The lesson the midpoint is built to test: information that moves the
    // price without removing risk must not narrow the market.
    const contract = WEEK3_CONTRACTS.find((c) => c.id === "w3-geometric-die")!;
    const seeds = contractsFor("contest").map(
        (c) => CONTEST_SEEDS[contractsFor("contest").indexOf(c)]!
    );
    const index = contractsFor("contest").findIndex((c) => c.id === contract.id);

    function revealScoreFor(secondWidthMultiple: number) {
        const quotes: Quote[] = [];
        for (let i = 0; i < contractsFor("contest").length; i++) {
            for (let stage = 0; stage < DD_STAGES; stage++) {
                const partial = replay(seeds, "contest", quotes);
                const live = partial.contracts[partial.contracts.length - 1]!;
                const { fair, sd } = momentsAt(live, live.stage);
                const mult = i === index && stage === 1 ? secondWidthMultiple : 1;
                const half = (mult * sd) / 2;
                quotes.push({ bid: fair - half, ask: fair + half });
            }
        }
        const breakdown = score(replay(seeds, "contest", quotes));
        return breakdown.contracts.find((c) => c.contractId === contract.id)!.revealScore!;
    }

    const held = revealScoreFor(1);
    const tightened = revealScoreFor(0.4);
    assert.ok(
        held > tightened,
        `holding width (${held.toFixed(3)}) should beat tightening (${tightened.toFixed(3)})`
    );
});

check("on the fixed contest seeds, correct play beats each classic mistake", () => {
    // The most important property for a leaderboard, and NOT implied by the
    // width-curve check above. That one averages over thousands of deals; a
    // contest deals exactly ONE, identical for everybody. A strategy can be
    // wrong on average and still win on the single realisation students are
    // actually given, which would rank the lucky above the correct and teach
    // the wrong lesson. An earlier tuning of flowPerStage did exactly that:
    // a market mispriced by half an SD outscored a perfect one.
    const strategies: { label: string; width: number; bias: number }[] = [
        { label: "quoting too tight", width: 0.4, bias: 0 },
        { label: "quoting too wide", width: 2.5, bias: 0 },
        { label: "mispricing by half an SD", width: 1, bias: 0.5 },
        { label: "mispricing by a full SD", width: 1, bias: 1 },
        // Adds the legs' SDs instead of their variances on the composites.
        { label: "adding SDs, not variances", width: 1.42, bias: 0 },
    ];

    function pnlFor(preset: "contest" | "midpoint", width: number, bias: number): number {
        const seeds = fixedSeedsFor(preset)!;
        const config = configFor(preset);
        let total = 0;
        contractsFor(preset).forEach((contract, i) => {
            let state = openContract(contract, config, mulberry32(seeds[i]!));
            for (let stage = 0; stage < DD_STAGES; stage++) {
                const { fair, sd } = momentsAt(state, state.stage);
                const half = Math.max(0.5, (width * sd) / 2);
                const mid = fair + bias * sd;
                state = applyQuote(state, { bid: mid - half, ask: mid + half }, config);
            }
            total += contractPnl(state);
        });
        return total;
    }

    for (const preset of ["contest", "midpoint"] as const) {
        const perfect = pnlFor(preset, 1, 0);
        assert.ok(perfect > 0, `${preset}: correct play does not even make money`);

        for (const { label, width, bias } of strategies) {
            const got = pnlFor(preset, width, bias);
            assert.ok(
                perfect > got,
                `${preset}: ${label} scored ${got.toFixed(0)}, beating correct play at ${perfect.toFixed(0)}`
            );
        }
    }
});

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

check("an in-flight projection leaks no hidden information", () => {
    const run = replay([...CONTEST_SEEDS], "contest", [{ bid: 130, ask: 150 }]);
    const projected = projectRun(run);
    const json = JSON.stringify(projected);

    assert.equal(projected.results, null);
    assert.equal(projected.breakdown, null);
    assert.equal(projected.previousResult, null, "contests must not coach mid-run");
    assert.ok(projected.contract, "expected a live contract");

    for (const forbidden of ["settlement", "units", "lesson", "informed", "realisation"]) {
        assert.ok(!json.includes(`"${forbidden}"`), `projection exposed a "${forbidden}" field`);
    }

    // The engine knows these; the client must not.
    const live = run.contracts[0]!;
    const truth = momentsAt(live, 0);
    assert.ok(!json.includes(String(live.realisation.settlement)), "projection exposed the settlement");
    assert.ok(!json.includes(String(truth.sd)), "projection exposed the true SD");
});

check("a settled projection reveals everything and matches the engine", () => {
    const contracts = contractsFor("contest");
    const quotes: Quote[] = Array.from({ length: contracts.length * DD_STAGES }, () => ({
        bid: 50,
        ask: 90,
    }));
    const run = replay([...CONTEST_SEEDS], "contest", quotes);
    const projected = projectRun(run);

    assert.ok(projected.complete);
    assert.equal(projected.contract, null);
    assert.equal(projected.results!.length, contracts.length);
    projected.results!.forEach((result, i) => {
        assert.equal(result.settlement, run.contracts[i]!.realisation.settlement);
        assert.equal(result.pnl, contractPnl(run.contracts[i]!));
    });
    assert.equal(
        projected.breakdown!.totalPnl,
        projected.results!.reduce((sum, r) => sum + r.pnl, 0)
    );
});

check("practice coaches between contracts, a contest does not", () => {
    const practiceContracts = contractsFor("practice");
    const seeds = practiceContracts.map((_, i) => 1000 + i);
    // Two full stages settles contract 0 and opens contract 1.
    const run = replay(seeds, "practice", [
        { bid: 100, ask: 180 },
        { bid: 100, ask: 180 },
    ]);
    const projected = projectRun(run);
    assert.ok(projected.previousResult, "practice should report the contract that just settled");
    assert.equal(projected.previousResult!.id, practiceContracts[0]!.id);
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

check("a sealed token round-trips and hides the seeds", () => {
    const session = createSession("contest", "week3");
    const token = seal(session);
    assert.deepEqual(openSession(token), session);

    const decoded = Buffer.from(token, "base64url").toString("latin1");
    for (const seed of session.seeds) {
        assert.ok(!decoded.includes(String(seed)), "a seed was readable in the token");
    }
});

check("any edit to a token is rejected", () => {
    const token = seal(createSession("contest"));
    const raw = Buffer.from(token, "base64url");
    for (const index of [0, 15, raw.length - 1]) {
        const tampered = Buffer.from(raw);
        tampered[index] ^= 0xff;
        assert.throws(() => openSession(tampered.toString("base64url")), DdSessionError);
    }
    assert.throws(() => openSession("not-a-token"), DdSessionError);
    assert.throws(() => openSession(""), DdSessionError);
    assert.throws(() => openSession(undefined), DdSessionError);
});

check("out-of-order and duplicate quotes are refused", () => {
    const session = createSession("contest");
    const quote: Quote = { bid: 100, ask: 140 };
    assert.throws(() => withQuote(session, 1, quote), DdSessionError);
    assert.throws(() => withQuote(session, 5, quote), DdSessionError);

    const { session: next } = withQuote(session, 0, quote);
    assert.equal(next.quotes.length, 1);
    assert.throws(() => withQuote(next, 0, quote), DdSessionError);
});

check("a run only reports complete after every contract has two quotes", () => {
    let session = createSession("contest");
    const total = contractsFor("contest").length * DD_STAGES;
    for (let i = 0; i < total; i++) {
        assert.equal(isComplete(session), false);
        session = withQuote(session, i, { bid: 100, ask: 140 }).session;
    }
    assert.equal(isComplete(session), true);
    assert.throws(() => withQuote(session, total, { bid: 1, ask: 2 }), DdSessionError);
});

check("a quote past the clock is recorded as an unfillable market", () => {
    const session = createSession("contest");
    const stale = {
        ...session,
        stageOpenedAt: Date.now() - (configFor("contest").secondsPerQuote + 60) * 1000,
    };
    const { session: next, lateQuote } = withQuote(stale, 0, { bid: 100, ask: 140 });
    assert.equal(lateQuote, true);
    assert.notDeepEqual(next.quotes[0], { bid: 100, ask: 140 });

    // And it must actually fill nothing, rather than merely being flagged.
    const run = replay([...CONTEST_SEEDS], "contest", [next.quotes[0]!]);
    assert.equal(run.contracts[0]!.fills.length, 0);
});

check("a contest always deals its fixed seed set, practice never does", () => {
    assert.deepEqual(createSession("contest").seeds, [...CONTEST_SEEDS]);
    assert.deepEqual(createSession("midpoint").seeds, [...MIDPOINT_SEEDS]);
    assert.equal(fixedSeedsFor("practice"), null);

    const a = createSession("practice").seeds;
    const b = createSession("practice").seeds;
    assert.notDeepEqual(a, b, "practice should deal fresh seeds each run");
});

check("every contest seed set is the right length and curated", () => {
    for (const preset of ["contest", "midpoint"] as const) {
        const contracts = contractsFor(preset);
        const seeds = fixedSeedsFor(preset)!;
        assert.equal(seeds.length, contracts.length, `${preset}: seed count does not match contracts`);

        contracts.forEach((contract, i) => {
            const realisation = realise(contract, mulberry32(seeds[i]!));
            const prior = moments(contract, realisation, nothingSeen(contract));

            // No contract's freak outcome should decide the leaderboard.
            if (prior.sd > 0) {
                const z = Math.abs(realisation.settlement - prior.fair) / prior.sd;
                assert.ok(z <= 1.5, `${contract.id}: settlement is ${z.toFixed(2)} SDs from fair`);
            }

            // A geometric reveal must not resolve the contract, or the
            // memorylessness lesson never fires.
            const leg = contract.legs[contract.reveal.legIndex]!;
            if (leg.kind === "geometric") {
                const prefix = realisation.units[contract.reveal.legIndex]!.slice(
                    0,
                    contract.reveal.units
                );
                assert.ok(!prefix.includes(1), `${contract.id}: the geometric reveal resolves it`);
            }
        });
    }
});

console.log(`\n${checks} checks passed.`);
