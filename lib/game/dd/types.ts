export interface Quote {
    bid: number;
    ask: number;
}

export type Stage = 0 | 1;

export interface Fill {
    contractId: string;
    stage: Stage;
    /** Which way the COUNTERPARTY went. The player takes the other side. */
    counterparty: "buy" | "sell";
    informed: boolean;
    price: number;
}

/** A single pre-drawn counterparty order. Drawn before the player decides. */
export interface FlowEvent {
    informed: boolean;
    /** Standard normal, scaled into the informed trader's signal error. */
    signalNoise: number;
    /** Uniform, compared against the uninformed participation probability. */
    participation: number;
    /** Uniform, picks the uninformed trader's direction. */
    direction: number;
}

export interface DdConfig {
    /** Share of counterparty orders that are informed. */
    informedShare: number;
    /** Informed signal error, as a multiple of the contract's current SD. */
    informedNoise: number;
    /**
     * How fast uninformed flow dries up as the market widens. Participation is
     * exp(-(width / (widthTolerance * sd))^2), so the best width is
     * proportional to the SD -- which is what forces the distribution maths
     * and the quoting to be the same skill.
     */
    widthTolerance: number;
    /**
     * Counterparty orders per stage.
     *
     * Not a cosmetic number. A contest deals ONE fixed realisation to
     * everybody, so each contract's P&L is a single sample: with only a
     * handful of orders the noise swamped the signal, and on the fixed seed
     * set a market mispriced by half an SD actually outscored a perfect one.
     * More orders per stage concentrate each contract's P&L toward its
     * expectation, which is what makes the ranking reward the maths rather
     * than the draw. Verified in scripts/check-dd-game.mts.
     */
    flowPerStage: number;
    /** Hard cap on absolute inventory; orders beyond it do not fill. */
    positionLimit: number;
    /** Seconds allowed per quote, enforced server-side. */
    secondsPerQuote: number;
}

export const DD_STAGES = 2;
export const MIN_WIDTH = 1;
