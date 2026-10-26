import { randomInt } from "node:crypto";
import { createSealedTokenCodec } from "../sealed-token";
import { isMtmPreset, type MtmPreset } from "./presets";
import { isMtmAction, MTM_TOTAL_ACTIONS, type MtmAction } from "./replay";

// Stateless hand sessions for Make the Market.
//
// The crypto, and the reasoning behind encrypting rather than signing, live in
// lib/game/sealed-token.ts. This file is only the MTM-shaped part: what a
// session contains and what counts as a well-formed one.

/** Hands older than this stop being playable, to bound token reuse. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export class MtmSessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MtmSessionError";
    }
}

export interface MtmSession {
    seed: number;
    preset: MtmPreset;
    actions: MtmAction[];
    issuedAt: number;
}

const codec = createSealedTokenCodec<MtmSession>({
    secretEnvVar: "MTM_SESSION_SECRET",
    maxAgeMs: MAX_AGE_MS,
    expiredMessage: "this hand has expired",
    fail: (message) => new MtmSessionError(message),
    validate(parsed) {
        const candidate = parsed as Partial<MtmSession>;

        if (typeof candidate.seed !== "number" || !Number.isInteger(candidate.seed)) {
            throw new MtmSessionError("invalid session token");
        }
        if (!isMtmPreset(candidate.preset)) {
            throw new MtmSessionError("invalid session token");
        }
        if (!Array.isArray(candidate.actions) || candidate.actions.length > MTM_TOTAL_ACTIONS) {
            throw new MtmSessionError("invalid session token");
        }
        if (!candidate.actions.every(isMtmAction)) {
            throw new MtmSessionError("invalid session token");
        }
        if (typeof candidate.issuedAt !== "number") {
            throw new MtmSessionError("invalid session token");
        }

        return {
            seed: candidate.seed,
            preset: candidate.preset,
            actions: candidate.actions as MtmAction[],
            issuedAt: candidate.issuedAt,
        };
    },
});

export function newSeed(): number {
    return randomInt(0, 2 ** 32);
}

export function createSession(preset: MtmPreset): MtmSession {
    return { seed: newSeed(), preset, actions: [], issuedAt: Date.now() };
}

export const seal = codec.seal;
export const open = codec.open;

/** Appends one decision. `index` must match the count already recorded, which
 *  makes a duplicate or out-of-order submit a rejection rather than a second
 *  trade (a double-clicked Buy button must not fill twice). */
export function withAction(session: MtmSession, index: number, action: MtmAction): MtmSession {
    if (index !== session.actions.length) {
        throw new MtmSessionError("out-of-order move");
    }
    if (session.actions.length >= MTM_TOTAL_ACTIONS) {
        throw new MtmSessionError("this hand is already complete");
    }
    return { ...session, actions: [...session.actions, action] };
}

export function isComplete(session: MtmSession): boolean {
    return session.actions.length >= MTM_TOTAL_ACTIONS;
}
