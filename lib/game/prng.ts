// Seeded PRNG shared by every game in lib/game/.
//
// Each engine takes `random` as an injectable parameter everywhere, which is
// what lets the server reproduce a run from a stored seed. Math.random cannot
// be replayed, so every server-side replay builds a generator from the run's
// seed instead.
//
// mulberry32 needs no dependency and is more than good enough to shuffle a
// deck or draw a few hundred Bernoulli trials. It is NOT cryptographic and
// does not need to be: what protects a score is that the seed never leaves
// the server in readable form (see sealed-token.ts), not the quality of the
// generator.
//
// CRITICAL INVARIANT: one generator instance per replay, consumed in strict
// order. A replay creates a single mulberry32(seed) and threads it through
// every state transition. Creating a second generator mid-replay, or
// consuming draws out of order, silently desynchronises the server's view
// from the one the player actually saw.
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
