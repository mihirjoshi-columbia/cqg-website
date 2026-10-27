// Checks for the Distribution Desk game core.
//
// This repo has no test framework, so these live as an ops script alongside
// scripts/check-mtm-game.mts. Run with:
//
//   npm run check:dd
//
// The distribution maths is the part most worth checking: a wrong variance
// formula would not crash anything, it would just quietly make the game
// unfair and teach the wrong thing. Every closed-form mean and SD here is
// cross-checked against Monte Carlo, including the POSTERIOR moments after a
// reveal, which is where the subtle cases (memorylessness, variance addition)
// live.
//
// Since the deal became random (lib/game/dd/deal.ts) these checks run over
// several generated deals rather than over one hand-written contract list.
// That is the point: a property that holds for a few curated contracts and
// fails for the next generated one would ship as a broken game.
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
import { DD_CONTRACT_COUNT, acceptable, makeDeal, type Deal } from "../lib/game/dd/deal";
import {
    applyQuote,
    contractPnl,
    DdQuoteError,
    momentsAt,
    openContract,
    validateQuote,
} from "../lib/game/dd/engine";
import { DD_PRESET_ORDER, configFor, type DdPreset } from "../lib/game/dd/presets";
import { replay } from "../lib/game/dd/replay";
import { score, verdictFor, CORRECT_WITHIN } from "../lib/game/dd/scoring";
import { projectRun } from "../lib/game/dd/project";
import {
    DdSessionError,
    createSession,
    isComplete,
    open as openSession,
    seal,
    totalQuotes,
    withQuote,
} from "../lib/game/dd/session";
import { DD_STAGES, type Quote } from "../lib/game/dd/types";

// session.ts refuses to run without a key, by design. These checks only
// exercise the seal/open round-trip locally, so an ephemeral one is fine --
// this is NOT a fallback in the app itself, which still fails loudly.
process.env.DD_SESSION_SECRET ??= randomBytes(32).toString("hex");

/** Deal seeds the checks run over. Arbitrary, but fixed so a failure repeats. */
const DEAL_SEEDS: readonly number[] = [11, 2_222, 33_333, 444_444, 5_555_555, 60_606_060];

const DEALS: Deal[] = DEAL_SEEDS.map(makeDeal);
const ALL_CONTRACTS: Contract[] = DEALS.flatMap((d) => d.contracts);

/** A smaller slice, for the checks that run Monte Carlo over every contract. */
const MC_DEALS = DEALS.slice(0, 2);
const MC_CONTRACTS = MC_DEALS.flatMap((d) => d.contracts);

let checks = 0;
function check(label: string, fn: () => void) {
    fn();
    checks++;
    console.log(`  ok  ${label}`);
}

// ---------------------------------------------------------------------------
// The deal generator
// ---------------------------------------------------------------------------

check("a deal is a pure function of its seed", () => {
    // The sealed token carries only the seed, and the server replays from
    // scratch on every request. If a deal were not reproducible, a player's
    // score would be computed against contracts they never saw.
    for (const seed of DEAL_SEEDS) {
        assert.deepEqual(makeDeal(seed), makeDeal(seed));
    }
});

check("every deal has the full slot set, in the same order", () => {
    for (const deal of DEALS) {
        assert.equal(deal.contracts.length, DD_CONTRACT_COUNT);
        assert.equal(deal.seeds.length, DD_CONTRACT_COUNT);

        const kinds = deal.contracts.map((c) => c.legs.map((l) => l.kind).join("+"));
        // The normal slot was removed on purpose; asserting the exact list
        // means re-adding a distribution has to be a deliberate edit here.
        assert.deepEqual(kinds, [
            "binomial",
            "geometric",
            "uniformSum",
            "binomial",
            "geometric",
            "binomial+geometric",
        ]);
    }
});

check("different deals really are different markets", () => {
    // The whole reason the generator exists. Two runs must not present the
    // same six contracts, or a player can memorise the answers.
    const signatures = DEALS.map((deal) => deal.contracts.map((c) => c.description).join("|"));
    assert.equal(new Set(signatures).size, signatures.length, "two deals were identical");

    // And no single slot should be stuck on one parameter set either.
    for (let slot = 0; slot < DD_CONTRACT_COUNT; slot++) {
        const seen = new Set(DEALS.map((d) => d.contracts[slot]!.description));
        assert.ok(seen.size > 1, `slot ${slot} produced the same contract in every deal`);
    }
});

check("every dealt realisation satisfies the teaching constraints", () => {
    for (const deal of DEALS) {
        deal.contracts.forEach((contract, i) => {
            assert.ok(
                acceptable(contract, deal.seeds[i]!),
                `${contract.id}: dealt a realisation its own acceptance test rejects`
            );
        });
    }
});

check("every contract leaves risk after its reveal, and is quotable", () => {
    for (const deal of DEALS) {
        deal.contracts.forEach((contract, i) => {
            const realisation = realise(contract, mulberry32(deal.seeds[i]!));
            const prior = moments(contract, realisation, nothingSeen(contract));
            const post = moments(contract, realisation, afterReveal(contract));

            assert.ok(prior.sd >= 3, `${contract.id}: prior SD ${prior.sd} is too small to quote`);
            assert.ok(post.sd > 0, `${contract.id}: the reveal left nothing to re-quote`);
            assert.ok(
                Math.abs(prior.fair) <= 3000,
                `${contract.id}: fair ${prior.fair} is off the scale`
            );
        });
    }
});

// ---------------------------------------------------------------------------
// Distribution maths
// ---------------------------------------------------------------------------

const MC_RUNS = 40_000;

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
    for (const contract of MC_CONTRACTS) {
        const random = mulberry32(4242);
        const mc = monteCarlo(() => realise(contract, random).settlement);
        const prior = moments(contract, realise(contract, mulberry32(7)), nothingSeen(contract));

        assert.ok(
            Math.abs(mc.mean - prior.fair) < 0.05 * prior.sd,
            `${contract.id}: fair ${prior.fair} vs MC ${mc.mean.toFixed(2)}`
        );
        assert.ok(
            Math.abs(mc.sd - prior.sd) / prior.sd < 0.04,
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
    MC_DEALS.forEach((deal) => {
        deal.contracts.forEach((contract, i) => {
            const realisation = realise(contract, mulberry32(deal.seeds[i]!));
            const seen = afterReveal(contract);
            const posterior = moments(contract, realisation, seen);

            const random = mulberry32(1234);
            const mc = monteCarlo(
                () => resampleUnrevealed(contract, realisation.units, seen, random),
                25_000
            );

            const scale = Math.max(posterior.sd, 1);
            assert.ok(
                Math.abs(mc.mean - posterior.fair) < 0.06 * scale,
                `${contract.id}: posterior fair ${posterior.fair.toFixed(2)} vs MC ${mc.mean.toFixed(2)}`
            );
            if (posterior.sd > 0) {
                assert.ok(
                    Math.abs(mc.sd - posterior.sd) / posterior.sd < 0.05,
                    `${contract.id}: posterior SD ${posterior.sd.toFixed(2)} vs MC ${mc.sd.toFixed(2)}`
                );
            }
        });
    });
});

check("a geometric reveal moves the fair but leaves the SD untouched", () => {
    // Memorylessness. This is the single most discriminating moment in the
    // game, so it is asserted directly rather than inferred from the MC above,
    // and on the realisations players are actually dealt.
    let seen = 0;
    DEALS.forEach((deal) => {
        deal.contracts.forEach((contract, i) => {
            const leg = contract.legs[contract.reveal.legIndex]!;
            if (leg.kind !== "geometric") return;
            seen++;

            const realisation = realise(contract, mulberry32(deal.seeds[i]!));
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
        });
    });
    assert.ok(seen >= DEALS.length * 2, "expected two geometric reveals per deal");
});

check("variances add across independent legs, standard deviations do not", () => {
    const composites = ALL_CONTRACTS.filter((c) => c.legs.length > 1);
    assert.equal(composites.length, DEALS.length, "expected one composite per deal");

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
        // And the mistake has to be worth catching: if one leg dominates,
        // adding the SDs is barely wrong and the contract teaches nothing.
        assert.ok(
            sumOfSds > whole.sd * 1.15,
            `${contract.id}: legs too lopsided -- adding SDs is only ${((sumOfSds / whole.sd - 1) * 100).toFixed(0)}% off`
        );
    }
});

// ---------------------------------------------------------------------------
// Engine determinism
// ---------------------------------------------------------------------------

check("the whole realisation is drawn before the first quote", () => {
    for (const contract of DEALS[0]!.contracts) {
        const config = configFor("homework");
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
    const config = configFor("homework");
    const counts = [0.5, 1, 4].map((mult) => {
        let draws = 0;
        const base = mulberry32(909);
        const random = () => {
            draws++;
            return base();
        };
        let state = openContract(DEALS[0]!.contracts[0]!, config, random);
        const { fair, sd } = momentsAt(state, 0);
        for (let stage = 0; stage < DD_STAGES; stage++) {
            state = applyQuote(state, { bid: fair - mult * sd, ask: fair + mult * sd }, config);
        }
        return draws;
    });
    assert.equal(new Set(counts).size, 1, `draw counts differed: ${counts.join(", ")}`);
});

check("replay is reproducible: same deal seed and quotes, same P&L", () => {
    const quotes: Quote[] = [];
    for (let i = 0; i < totalQuotes(); i++) {
        quotes.push({ bid: 100 + i, ask: 140 + i });
    }

    const a = score(replay(DEAL_SEEDS[0]!, "homework", quotes));
    const b = score(replay(DEAL_SEEDS[0]!, "homework", quotes));
    assert.deepEqual(a, b);
    assert.ok(Number.isFinite(a.totalPnl));

    // And a different deal seed must give a different run, or the seed is
    // being ignored somewhere.
    const other = score(replay(DEAL_SEEDS[1]!, "homework", quotes));
    assert.notEqual(other.totalPnl, a.totalPnl);
});

check("a partial run exposes exactly one live contract", () => {
    const run = replay(DEAL_SEEDS[0]!, "homework", [{ bid: 130, ask: 150 }]);
    assert.equal(run.complete, false);
    assert.equal(run.contracts.length, 1);
    assert.equal(run.contracts[0]!.stage, 1);
    assert.equal(run.contracts[0]!.settled, false);
});

check("a full run settles every contract", () => {
    const quotes: Quote[] = Array.from({ length: totalQuotes() }, () => ({ bid: 0, ask: 1000 }));
    const run = replay(DEAL_SEEDS[0]!, "homework", quotes);
    assert.equal(run.complete, true);
    assert.equal(run.contracts.length, DD_CONTRACT_COUNT);
    assert.ok(run.contracts.every((c) => c.settled));
});

check("settlement P&L is cash plus inventory marked at the settlement price", () => {
    const config = configFor("homework");
    let state = openContract(DEALS[0]!.contracts[0]!, config, mulberry32(17));
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
        for (const contract of MC_CONTRACTS) {
            for (let seed = 0; seed < 20; seed++) {
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
    const RUNS = 600;

    for (const preset of DD_PRESET_ORDER) {
        const config = configFor(preset);

        const curve = multiples.map((mult) => {
            let total = 0;
            for (const contract of MC_CONTRACTS) {
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
            return total / (RUNS * MC_CONTRACTS.length);
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

/**
 * Plays a whole run with a strategy expressed in terms of the truth the
 * player is trying to estimate, so "correct play" and each classic mistake
 * can be compared on the same deal.
 */
function playRun(dealSeed: number, build: (fair: number, sd: number, stage: number) => Quote) {
    const quotes: Quote[] = [];
    for (let i = 0; i < DD_CONTRACT_COUNT; i++) {
        for (let stage = 0; stage < DD_STAGES; stage++) {
            const partial = replay(dealSeed, "homework", quotes);
            const live = partial.contracts[partial.contracts.length - 1]!;
            const { fair, sd } = momentsAt(live, live.stage);
            quotes.push(build(fair, sd, stage));
        }
    }
    return { quotes, breakdown: score(replay(dealSeed, "homework", quotes)) };
}

check("a well-calibrated run outscores a careless one on every sub-score", () => {
    const sharp = playRun(DEAL_SEEDS[0]!, (fair, sd) => ({ bid: fair - sd / 2, ask: fair + sd / 2 }));
    // Mispriced, mis-sized, and blind to the reveal.
    const sloppy = playRun(DEAL_SEEDS[0]!, (fair, sd) => ({
        bid: fair - sd * 2.5,
        ask: fair + sd * 0.4,
    }));

    assert.ok(
        sharp.breakdown.pricing > sloppy.breakdown.pricing,
        "pricing sub-score did not separate the runs"
    );
    assert.ok(
        sharp.breakdown.widthCalibration > sloppy.breakdown.widthCalibration,
        "width calibration sub-score did not separate the runs"
    );
    assert.ok(sharp.breakdown.totalPnl > sloppy.breakdown.totalPnl, "P&L did not separate the runs");
    for (const value of [
        sharp.breakdown.pricing,
        sharp.breakdown.widthCalibration,
        sharp.breakdown.revealResponse,
        sharp.breakdown.riskControl,
    ]) {
        assert.ok(value >= 0 && value <= 1, `sub-score ${value} out of range`);
    }
});

check("the verdicts a player is shown match how they actually played", () => {
    // The verdicts are now the ONLY feedback, so they have to be right at both
    // ends: exact play reads "correct", and a formula-level mistake does not.
    for (const dealSeed of DEAL_SEEDS.slice(0, 3)) {
        const exact = playRun(dealSeed, (fair, sd) => ({ bid: fair - sd / 2, ask: fair + sd / 2 }));
        assert.equal(exact.breakdown.verdicts.pricing, "correct", "exact pricing was not correct");
        assert.equal(exact.breakdown.verdicts.width, "correct", "exact width was not correct");
        assert.equal(exact.breakdown.verdicts.reveal, "correct", "exact reveal was not correct");

        // Half an SD of price bias and double the width: both "very wrong".
        const wrong = playRun(dealSeed, (fair, sd) => ({ bid: fair, ask: fair + 2 * sd }));
        assert.equal(wrong.breakdown.verdicts.width, "off", "doubling the width read as fine");
    }

    assert.equal(verdictFor(0), "correct");
    assert.equal(verdictFor(CORRECT_WITHIN), "correct");
    assert.equal(verdictFor(CORRECT_WITHIN + 0.01), "close");
    assert.equal(verdictFor(0.5), "off");
});

check("tightening across a geometric reveal is marked down", () => {
    // The lesson the exercise is built to test: information that moves the
    // price without removing risk must not narrow the market. Slot 1 is always
    // a geometric contract (see SLOTS in deal.ts).
    const dealSeed = DEAL_SEEDS[0]!;
    const index = 1;
    const contractId = makeDeal(dealSeed).contracts[index]!.id;

    function revealScoreFor(secondWidthMultiple: number) {
        const quotes: Quote[] = [];
        for (let i = 0; i < DD_CONTRACT_COUNT; i++) {
            for (let stage = 0; stage < DD_STAGES; stage++) {
                const partial = replay(dealSeed, "homework", quotes);
                const live = partial.contracts[partial.contracts.length - 1]!;
                const { fair, sd } = momentsAt(live, live.stage);
                const mult = i === index && stage === 1 ? secondWidthMultiple : 1;
                const half = (mult * sd) / 2;
                quotes.push({ bid: fair - half, ask: fair + half });
            }
        }
        const breakdown = score(replay(dealSeed, "homework", quotes));
        return breakdown.contracts.find((c) => c.contractId === contractId)!.revealScore!;
    }

    const held = revealScoreFor(1);
    const tightened = revealScoreFor(0.4);
    assert.ok(
        held > tightened,
        `holding width (${held.toFixed(3)}) should beat tightening (${tightened.toFixed(3)})`
    );
});

check("across many deals, correct play beats each classic mistake", () => {
    // The most important property for a leaderboard, and NOT implied by the
    // width-curve check above. That one averages over thousands of flow draws
    // on a handful of contracts; this one plays whole runs the way a player
    // does. Deals are random now, so the comparison is averaged over many of
    // them: a strategy must not be able to win by being lucky on one.
    const strategies: { label: string; width: number; bias: number }[] = [
        { label: "quoting too tight", width: 0.4, bias: 0 },
        { label: "quoting too wide", width: 2.5, bias: 0 },
        { label: "mispricing by half an SD", width: 1, bias: 0.5 },
        { label: "mispricing by a full SD", width: 1, bias: 1 },
        // Adds the legs' SDs instead of their variances on the composite.
        { label: "adding SDs, not variances", width: 1.42, bias: 0 },
    ];

    const RUN_SEEDS = Array.from({ length: 24 }, (_, i) => 90_001 + i * 1_013);

    function totalFor(preset: DdPreset, width: number, bias: number): number {
        const config = configFor(preset);
        let total = 0;
        for (const dealSeed of RUN_SEEDS) {
            const { contracts, seeds } = makeDeal(dealSeed);
            contracts.forEach((contract, i) => {
                let state = openContract(contract, config, mulberry32(seeds[i]!));
                for (let stage = 0; stage < DD_STAGES; stage++) {
                    const { fair, sd } = momentsAt(state, state.stage);
                    const half = Math.max(0.5, (width * sd) / 2);
                    const mid = fair + bias * sd;
                    state = applyQuote(state, { bid: mid - half, ask: mid + half }, config);
                }
                // Normalised by the contract's own scale, so one large-SD
                // contract cannot drown out the other six.
                const scale = Math.max(1, momentsAt(state, 0).sd);
                total += contractPnl(state) / scale;
            });
        }
        return total / RUN_SEEDS.length;
    }

    for (const preset of DD_PRESET_ORDER) {
        const perfect = totalFor(preset, 1, 0);
        assert.ok(perfect > 0, `${preset}: correct play does not even make money`);

        for (const { label, width, bias } of strategies) {
            const got = totalFor(preset, width, bias);
            assert.ok(
                perfect > got,
                `${preset}: ${label} scored ${got.toFixed(2)}, beating correct play at ${perfect.toFixed(2)}`
            );
        }
    }
});

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

check("an in-flight projection leaks no hidden information", () => {
    const run = replay(DEAL_SEEDS[0]!, "homework", [{ bid: 130, ask: 150 }]);
    const projected = projectRun(run);
    const json = JSON.stringify(projected);

    assert.equal(projected.results, null);
    assert.equal(projected.breakdown, null);
    assert.ok(projected.contract, "expected a live contract");

    for (const forbidden of ["settlement", "units", "lesson", "informed", "realisation", "fair", "sd"]) {
        assert.ok(!json.includes(`"${forbidden}"`), `projection exposed a "${forbidden}" field`);
    }

    // The engine knows these; the client must not.
    const live = run.contracts[0]!;
    const truth = momentsAt(live, 0);
    assert.ok(!json.includes(String(live.realisation.settlement)), "projection exposed the settlement");
    assert.ok(!json.includes(String(truth.sd)), "projection exposed the true SD");
});

check("a settled projection reveals verdicts and nothing else", () => {
    // The change that matters most here: finishing a run no longer hands over
    // the worked answer. Attempts are unlimited, so printing each contract's
    // true fair and SD would make the next run transcription.
    const quotes: Quote[] = Array.from({ length: totalQuotes() }, () => ({ bid: 50, ask: 90 }));
    const run = replay(DEAL_SEEDS[0]!, "homework", quotes);
    const projected = projectRun(run);
    const json = JSON.stringify(projected);

    assert.ok(projected.complete);
    assert.equal(projected.contract, null);
    assert.equal(projected.results!.length, DD_CONTRACT_COUNT);

    for (const forbidden of ["settlement", "fair", "sd", "lesson", "mid", "pricingError", "units"]) {
        assert.ok(!json.includes(`"${forbidden}"`), `settled projection exposed "${forbidden}"`);
    }

    // The field list is asserted exactly rather than by scanning the JSON for
    // the true numbers: a P&L is computed FROM the settlement, so a digit
    // scan flags innocent values and misses a genuinely new leaking field.
    // Pinning the shape is what actually holds the line -- adding a field to
    // the projection now fails here until someone has thought about it.
    projected.results!.forEach((result, i) => {
        assert.deepEqual(
            Object.keys(result).sort(),
            [
                "description",
                "id",
                "informedFills",
                "inventory",
                "pnl",
                "revealText",
                "stages",
                "uninformedFills",
            ],
            "the settled projection grew a field"
        );
        assert.equal(result.pnl, contractPnl(run.contracts[i]!));
        assert.equal(result.stages.length, DD_STAGES);
        for (const stage of result.stages) {
            assert.deepEqual(Object.keys(stage).sort(), ["price", "stage", "width"]);
            assert.ok(["correct", "close", "off"].includes(stage.price));
        }
    });
    assert.deepEqual(
        Object.keys(projected.breakdown!).sort(),
        ["maxInventory", "pricing", "reveal", "risk", "scaledPnl", "totalPnl", "width"],
        "the run-level report grew a field"
    );
    assert.equal(
        projected.breakdown!.totalPnl,
        projected.results!.reduce((sum, r) => sum + r.pnl, 0)
    );
});

check("the ranked score survives a change of deal, and raw P&L does not", () => {
    // Why the leaderboard ranks scaledPnl. Identical correct play across many
    // deals must produce roughly the same SCORE, even though the cash swings
    // with however much risk each deal happened to carry. If this inverts,
    // the leaderboard is measuring the deal rather than the player.
    const config = configFor("homework");
    const raw: number[] = [];
    const scaled: number[] = [];

    for (let d = 0; d < 30; d++) {
        const { contracts, seeds } = makeDeal((7_919 * (d + 1) + 13) >>> 0);
        let cash = 0;
        let points = 0;
        contracts.forEach((contract, i) => {
            let state = openContract(contract, config, mulberry32(seeds[i]!));
            const priorSd = momentsAt(state, 0).sd;
            for (let stage = 0; stage < DD_STAGES; stage++) {
                const { fair, sd } = momentsAt(state, state.stage);
                state = applyQuote(state, { bid: fair - sd / 2, ask: fair + sd / 2 }, config);
            }
            cash += contractPnl(state);
            points += contractPnl(state) / Math.max(priorSd, 1);
        });
        raw.push(cash);
        scaled.push(points);
    }

    const spread = (values: number[]) => {
        const m = values.reduce((a, b) => a + b, 0) / values.length;
        const sd = Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
        return sd / Math.abs(m);
    };

    const rawSpread = spread(raw);
    const scaledSpread = spread(scaled);
    assert.ok(
        scaledSpread < rawSpread * 0.8,
        `scaling did not reduce deal luck: ${scaledSpread.toFixed(2)} vs raw ${rawSpread.toFixed(2)}`
    );
    assert.ok(Math.min(...scaled) > 0, "correct play lost points on some deal");
});

check("the stored breakdown keeps the numbers the screen hides", () => {
    // The verdicts are for the player; an admin looking at an attempt row
    // still needs to see exactly where a run went wrong.
    const { breakdown } = playRun(DEAL_SEEDS[0]!, (fair, sd) => ({
        bid: fair - sd / 2,
        ask: fair + sd / 2,
    }));
    const stage = breakdown.contracts[0]!.stages[0]!;
    assert.ok(Number.isFinite(stage.fair));
    assert.ok(Number.isFinite(stage.sd));
    assert.ok(Number.isFinite(stage.priceError));
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

check("a sealed token round-trips and hides the deal seed", () => {
    const session = createSession("homework", "week3");
    const token = seal(session);
    assert.deepEqual(openSession(token), session);

    const decoded = Buffer.from(token, "base64url").toString("latin1");
    assert.ok(!decoded.includes(String(session.dealSeed)), "the deal seed was readable in the token");
});

check("any edit to a token is rejected", () => {
    const token = seal(createSession("homework"));
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
    const session = createSession("homework");
    const quote: Quote = { bid: 100, ask: 140 };
    assert.throws(() => withQuote(session, 1, quote), DdSessionError);
    assert.throws(() => withQuote(session, 5, quote), DdSessionError);

    const { session: next } = withQuote(session, 0, quote);
    assert.equal(next.quotes.length, 1);
    assert.throws(() => withQuote(next, 0, quote), DdSessionError);
});

check("a run only reports complete after every contract has two quotes", () => {
    let session = createSession("homework");
    const total = totalQuotes();
    for (let i = 0; i < total; i++) {
        assert.equal(isComplete(session), false);
        session = withQuote(session, i, { bid: 100, ask: 140 }).session;
    }
    assert.equal(isComplete(session), true);
    assert.throws(() => withQuote(session, total, { bid: 1, ask: 2 }), DdSessionError);
});

check("a quote past the clock is recorded as an unfillable market", () => {
    const session = createSession("homework");
    const stale = {
        ...session,
        stageOpenedAt: Date.now() - (configFor("homework").secondsPerQuote + 60) * 1000,
    };
    const { session: next, lateQuote } = withQuote(stale, 0, { bid: 100, ask: 140 });
    assert.equal(lateQuote, true);
    assert.notDeepEqual(next.quotes[0], { bid: 100, ask: 140 });

    // And it must actually fill nothing, rather than merely being flagged.
    const run = replay(next.dealSeed, "homework", [next.quotes[0]!]);
    assert.equal(run.contracts[0]!.fills.length, 0);
});

check("every run is dealt a fresh deal", () => {
    // Attempts are unlimited, so the defence against grinding a known answer
    // is that there is no known answer: two sessions must not share a deal.
    const seeds = new Set(Array.from({ length: 50 }, () => createSession("homework").dealSeed));
    assert.ok(seeds.size >= 49, `deal seeds repeated: only ${seeds.size} distinct out of 50`);
});

console.log(`\n${checks} checks passed.`);
