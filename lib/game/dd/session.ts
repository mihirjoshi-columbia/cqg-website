import { randomInt } from "node:crypto";
import { createSealedTokenCodec } from "../sealed-token";
import { contractsFor, configFor, isDdPreset, type DdPreset } from "./presets";
import { seedsFor } from "./seeds";
import { DD_STAGES, type Quote } from "./types";

// Stateless run sessions for Distribution Desk.
//
// The crypto, and the reasoning behind encrypting rather than signing, live in
// lib/game/sealed-token.ts. This file is only the DD-shaped part: what a run
// session contains, what counts as a well-formed one, and the per-quote clock.
//
// The seeds are the thing that must stay secret. A seed determines the whole
// realisation of a contract, so a readable token would hand the player the
// settlement value of a market they have not quoted yet.

/** Runs older than this stop being playable, to bound token reuse. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Slack on the per-quote clock, covering latency and clock skew. */
const CLOCK_GRACE_MS = 3000;

export class DdSessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DdSessionError";
    }
}

export interface DdSession {
    seeds: number[];
    preset: DdPreset;
    quotes: Quote[];
    issuedAt: number;
    /** When the current quote's clock started. */
    stageOpenedAt: number;
    /** Set for contest runs, so the attempt row can be matched on submit. */
    contestSlug: string | null;
    /**
     * The attempt row this run writes its result to. Carried in the sealed
     * token rather than looked up on submit, so a run can never land on a
     * different attempt than the one it was dealt for.
     */
    attemptId: string | null;
}

function isQuote(value: unknown): value is Quote {
    if (typeof value !== "object" || value === null) return false;
    const q = value as Partial<Quote>;
    return (
        typeof q.bid === "number" &&
        Number.isFinite(q.bid) &&
        typeof q.ask === "number" &&
        Number.isFinite(q.ask)
    );
}

const codec = createSealedTokenCodec<DdSession>({
    secretEnvVar: "DD_SESSION_SECRET",
    maxAgeMs: MAX_AGE_MS,
    expiredMessage: "this run has expired",
    fail: (message) => new DdSessionError(message),
    validate(parsed) {
        const candidate = parsed as Partial<DdSession>;

        if (!isDdPreset(candidate.preset)) {
            throw new DdSessionError("invalid session token");
        }
        const maxQuotes = contractsFor().length * DD_STAGES;

        if (
            !Array.isArray(candidate.seeds) ||
            candidate.seeds.length !== contractsFor().length ||
            !candidate.seeds.every((s) => typeof s === "number" && Number.isInteger(s))
        ) {
            throw new DdSessionError("invalid session token");
        }
        if (
            !Array.isArray(candidate.quotes) ||
            candidate.quotes.length > maxQuotes ||
            !candidate.quotes.every(isQuote)
        ) {
            throw new DdSessionError("invalid session token");
        }
        if (typeof candidate.issuedAt !== "number") {
            throw new DdSessionError("invalid session token");
        }
        if (typeof candidate.stageOpenedAt !== "number") {
            throw new DdSessionError("invalid session token");
        }
        if (candidate.contestSlug !== null && typeof candidate.contestSlug !== "string") {
            throw new DdSessionError("invalid session token");
        }
        if (candidate.attemptId !== null && typeof candidate.attemptId !== "string") {
            throw new DdSessionError("invalid session token");
        }

        return {
            seeds: candidate.seeds as number[],
            preset: candidate.preset,
            quotes: candidate.quotes as Quote[],
            issuedAt: candidate.issuedAt,
            stageOpenedAt: candidate.stageOpenedAt,
            contestSlug: candidate.contestSlug ?? null,
            attemptId: candidate.attemptId ?? null,
        };
    },
});

export function newSeed(): number {
    return randomInt(0, 2 ** 32);
}

export function createSession(
    preset: DdPreset,
    contestSlug: string | null = null,
    attemptId: string | null = null
): DdSession {
    // Always the fixed, curated seed set: every student is dealt identical
    // contracts, which is what makes the ranking skill rather than luck.
    const seeds = [...seedsFor()];

    const now = Date.now();
    return {
        seeds,
        preset,
        quotes: [],
        issuedAt: now,
        stageOpenedAt: now,
        contestSlug,
        attemptId,
    };
}

export const seal = codec.seal;
export const open = codec.open;

/** Quotes in a complete run: two per contract. */
export function totalQuotes(): number {
    return contractsFor().length * DD_STAGES;
}

export function isComplete(session: DdSession): boolean {
    return session.quotes.length >= totalQuotes();
}

/**
 * Appends one quote. `index` must match the count already recorded, so a
 * double-submitted quote is rejected rather than counted as the next stage's.
 *
 * The clock is checked here rather than in the route because this is the only
 * place that knows when the stage opened. A late quote is not rejected -- that
 * would leave the run unfinishable -- it is accepted as the widest possible
 * market, which fills nothing and scores nothing. Running out of time costs
 * the contract, not the run.
 */
export function withQuote(
    session: DdSession,
    index: number,
    quote: Quote
): { session: DdSession; lateQuote: boolean } {
    if (index !== session.quotes.length) {
        throw new DdSessionError("out-of-order quote");
    }
    if (isComplete(session)) {
        throw new DdSessionError("this run is already complete");
    }

    const limitMs = configFor(session.preset).secondsPerQuote * 1000 + CLOCK_GRACE_MS;
    const lateQuote = Date.now() - session.stageOpenedAt > limitMs;
    const recorded: Quote = lateQuote ? { bid: -1e6, ask: 1e6 } : quote;

    return {
        session: {
            ...session,
            quotes: [...session.quotes, recorded],
            stageOpenedAt: Date.now(),
        },
        lateQuote,
    };
}
