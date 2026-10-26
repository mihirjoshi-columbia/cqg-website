import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// ===========================================================================
// Stateless sealed sessions, shared by the games in lib/game/.
//
// The server has to own the hidden state -- otherwise a player reads the
// unrevealed cards (or the realised process) out of JS memory and plays with
// perfect information, and the score means nothing. But owning that state
// normally means storing it somewhere.
//
// So the session travels with the client as an opaque token: the seed and the
// decisions so far, encrypted with AES-256-GCM under a server-only key. The
// client holds it and sends it back with each move, but cannot read it
// (confidentiality hides the seed, and therefore the hidden state) or alter
// it (GCM's auth tag makes any edit fail to decrypt).
//
// Why ENCRYPT rather than just sign: a signed-but-readable token would hand
// the player the seed, and the seed determines everything hidden. Integrity
// alone is not enough here -- secrecy is the whole point.
//
// What this does NOT defend against on its own: a player can abandon a run
// and start again until they like the result, because statelessness means
// nothing remembers that the first run happened. A game that needs a
// trustworthy competitive score must record the attempt separately, at the
// moment it is dealt.
// ===========================================================================

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const TAG_BYTES = 16;

/** Tokens longer than this are rejected before any crypto work is attempted. */
const MAX_TOKEN_CHARS = 8192;

export interface SealedTokenOptions<T> {
    /** Name of the env var holding the key. Must be >= 32 characters. */
    secretEnvVar: string;
    /** Sessions older than this stop being playable, to bound token reuse. */
    maxAgeMs: number;
    /** Wording for the expiry error, so each game can name its own unit. */
    expiredMessage?: string;
    /**
     * Turns a message into the error this game throws. Each game keeps its own
     * error class so callers can catch precisely.
     */
    fail: (message: string) => Error;
    /**
     * Decryption proves the token is ours, but not that it is well-formed --
     * this validates the shape before any engine sees it. Must throw (via
     * `fail`) or return the typed session.
     */
    validate: (candidate: unknown) => T;
}

export interface SealedTokenCodec<T extends { issuedAt: number }> {
    seal: (session: T) => string;
    open: (token: unknown) => T;
}

export function createSealedTokenCodec<T extends { issuedAt: number }>(
    options: SealedTokenOptions<T>
): SealedTokenCodec<T> {
    // A missing key is a hard failure rather than a silent fallback: a default
    // or generated key would either be public (no security at all) or differ
    // between serverless instances (tokens randomly failing to decrypt).
    function key(): Buffer {
        const secret = process.env[options.secretEnvVar];
        if (!secret || secret.length < 32) {
            throw options.fail(
                `${options.secretEnvVar} is not set (or is shorter than 32 characters)`
            );
        }
        // Hashed to exactly 32 bytes so any sufficiently long secret works.
        return createHash("sha256").update(secret).digest();
    }

    function seal(session: T): string {
        const iv = randomBytes(IV_BYTES);
        const cipher = createCipheriv(ALGORITHM, key(), iv);
        const body = Buffer.concat([
            cipher.update(JSON.stringify(session), "utf8"),
            cipher.final(),
        ]);
        // iv | tag | ciphertext, base64url so it is safe in a JSON body.
        return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
    }

    function open(token: unknown): T {
        if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_CHARS) {
            throw options.fail("missing session token");
        }

        let plaintext: string;
        try {
            const raw = Buffer.from(token, "base64url");
            if (raw.length <= IV_BYTES + TAG_BYTES) throw new Error("too short");
            const decipher = createDecipheriv(ALGORITHM, key(), raw.subarray(0, IV_BYTES));
            decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
            plaintext = Buffer.concat([
                decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
                // Throws if the auth tag does not match, i.e. if anything in
                // the token was altered. This is the tamper check.
                decipher.final(),
            ]).toString("utf8");
        } catch {
            // Deliberately one undifferentiated error: telling a caller *why*
            // their token failed is free information for someone probing it.
            throw options.fail("invalid session token");
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(plaintext);
        } catch {
            throw options.fail("invalid session token");
        }

        const session = options.validate(parsed);

        if (Date.now() - session.issuedAt > options.maxAgeMs) {
            throw options.fail(options.expiredMessage ?? "this session has expired");
        }

        return session;
    }

    return { seal, open };
}
