// Seeded PRNG for Make the Market.
//
// The engine takes `random` as an injectable parameter everywhere, which is
// what lets the server reproduce a hand from a stored seed. Math.random
// cannot be replayed, so every server-side replay builds a generator from the
// hand's seed instead.
//
// mulberry32 needs no dependency and is more than good enough to shuffle a
// 39-card deck. It is NOT cryptographic and does not need to be: what
// protects the score is that the seed never leaves the server in readable
// form (see session.ts), not the quality of the generator.
//
// CRITICAL INVARIANT: one generator instance per replay, consumed in strict
// order. replay() creates a single mulberry32(seed) and threads it through
// startGame -> every trade/pass -> every advance. Creating a second generator
// mid-replay, or consuming draws out of order, silently desynchronises the
// server's quotes from the ones the player actually saw.
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
