import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from "node:crypto";
import { isMtmPreset, type MtmPreset } from "./presets";
import { isMtmAction, MTM_TOTAL_ACTIONS, type MtmAction } from "./replay";

// ===========================================================================
// Stateless hand sessions.
//
// The server has to own the deal -- otherwise a player reads the four hidden
// cards out of JS memory and trades with perfect information, and the score
// means nothing. But owning the deal normally means storing it somewhere, and
// there is deliberately no database for this feature.
//
// So the session travels with the client as an opaque token: the seed, the
// preset and the decisions so far, encrypted with AES-256-GCM under a
// server-only key. The client holds it and sends it back with each move, but
// cannot read it (confidentiality hides the seed, and therefore the cards) or
// alter it (GCM's auth tag makes any edit fail to decrypt).
//
// Why ENCRYPT rather than just sign: a signed-but-readable token would hand
// the player the seed, and the seed determines every hidden card. Integrity
// alone is not enough here -- secrecy is the whole point.
//
// What this does NOT defend against, honestly: a player can abandon a hand
// and deal again until they like the result, because statelessness means
// nothing remembers that the first hand happened. Scores are trustworthy
// individually; they are not a complete record of attempts.
// ===========================================================================

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const TAG_BYTES = 16;

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

// A missing key is a hard failure rather than a silent fallback: a default or
// generated key would either be public (no security at all) or differ between
// serverless instances (tokens randomly failing to decrypt).
function key(): Buffer {
    const secret = process.env.MTM_SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new MtmSessionError(
            "MTM_SESSION_SECRET is not set (or is shorter than 32 characters)"
        );
    }
    // Hashed to exactly 32 bytes so any sufficiently long secret works.
    return createHash("sha256").update(secret).digest();
}

export function newSeed(): number {
    return randomInt(0, 2 ** 32);
}

export function createSession(preset: MtmPreset): MtmSession {
    return { seed: newSeed(), preset, actions: [], issuedAt: Date.now() };
}

export function seal(session: MtmSession): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key(), iv);
    const body = Buffer.concat([
        cipher.update(JSON.stringify(session), "utf8"),
        cipher.final(),
    ]);
    // iv | tag | ciphertext, base64url so it is safe in a JSON body.
    return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function open(token: unknown): MtmSession {
    if (typeof token !== "string" || token.length === 0 || token.length > 8192) {
        throw new MtmSessionError("missing session token");
    }

    let plaintext: string;
    try {
        const raw = Buffer.from(token, "base64url");
        if (raw.length <= IV_BYTES + TAG_BYTES) throw new Error("too short");
        const decipher = createDecipheriv(ALGORITHM, key(), raw.subarray(0, IV_BYTES));
        decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
        plaintext = Buffer.concat([
            decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
            // Throws if the auth tag does not match, i.e. if anything in the
            // token was altered. This is the tamper check.
            decipher.final(),
        ]).toString("utf8");
    } catch {
        // Deliberately one undifferentiated error: telling a caller *why*
        // their token failed is free information for someone probing it.
        throw new MtmSessionError("invalid session token");
    }

    // Decryption proves the token is ours, but not that it is well-formed --
    // validate the shape before the engine sees any of it.
    let parsed: unknown;
    try {
        parsed = JSON.parse(plaintext);
    } catch {
        throw new MtmSessionError("invalid session token");
    }
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
    if (Date.now() - candidate.issuedAt > MAX_AGE_MS) {
        throw new MtmSessionError("this hand has expired");
    }

    return {
        seed: candidate.seed,
        preset: candidate.preset,
        actions: candidate.actions as MtmAction[],
        issuedAt: candidate.issuedAt,
    };
}

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
