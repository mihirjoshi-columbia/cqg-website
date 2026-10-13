import { COMMUNITY_COUNT, TOTAL_ROUNDS } from "./deck";
import {
    finalPnl,
    isLastRound,
    markPnl,
    playerFair,
    roundComplete,
    trueValue,
    type GameState,
} from "./engine";
import type { Card, Trade } from "./types";
import type { MtmAction } from "./replay";
import type { MtmPreset } from "./presets";

// ===========================================================================
// The redaction boundary. GameState contains every hidden card, so it can
// NEVER be serialised to the browser as-is: a client that can read it knows
// the settlement value before placing a trade and can post a perfect score.
// Everything the client receives goes through this file.
//
// Four distinct leaks are closed here:
//
//   1. maker.card             -- the hidden cards are the entire game.
//   2. quote.privateFair      -- literally fairValue(maker.card, ...), so it
//                                inverts straight back to the maker's card.
//   3. quote.mid              -- the pre-rounding mid carries the private
//                                fair plus the noise draw. Only the integer
//                                bid/ask are safe to send.
//   4. quotes past the cursor -- GameState holds a quote for all four makers
//                                at once and the UI merely hides the ones
//                                after activeMaker. Sending them would let a
//                                player see maker four's market before
//                                answering maker one, which changes the
//                                game. Quotes are truncated to the cursor.
//
// Unrevealed community cards are sent as nulls rather than omitted, so the UI
// can still render the right number of card backs.
// ===========================================================================

export interface MtmPublicQuote {
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
}

export interface MtmPublicMaker {
    id: string;
    name: string;
    style: string;
    description: string;
}

export interface MtmPublicState {
    preset: MtmPreset;
    phase: "playing" | "done";
    round: number;
    totalRounds: number;
    communityCount: number;

    playerCard: Card;
    /** null for any card not yet turned over. */
    community: (Card | null)[];
    revealed: number;

    makers: MtmPublicMaker[];
    /** Only up to and including the live maker. Never reads ahead. */
    quotes: (MtmPublicQuote | null)[];
    activeMaker: number;
    roundActions: (MtmAction | null)[];

    roundComplete: boolean;
    isLastRound: boolean;

    hardMode: boolean;
    expertMode: boolean;
    showEstimate: boolean;

    // Withheld entirely in hard mode until settlement.
    position?: number;
    cash?: number;
    avgEntry?: number;
    markPnl?: number;
    trades?: Trade[];

    /** Training preset only. Derivable from public info, so safe to send. */
    fairEstimate?: number;
}

/** Everything about a maker, revealed only once the hand is over. */
export interface MtmMakerResult extends MtmPublicMaker {
    card: Card;
    fills: number;
    inventory: number;
}

export interface MtmSettledState extends MtmPublicState {
    phase: "done";
    trueValue: number;
    finalPnl: number;
    /** Revealed only now that the hand is over. */
    makerResults: MtmMakerResult[];
    settledCommunity: Card[];
    trades: Trade[];
}

function publicQuotes(state: GameState): (MtmPublicQuote | null)[] {
    return state.makers.map((_, i) => {
        const quote = state.quotes[i];
        // Leak 4: nothing past the cursor is visible.
        if (!quote || i > state.activeMaker) return null;
        return { bid: quote.bid, ask: quote.ask, bidSize: quote.bidSize, askSize: quote.askSize };
    });
}

export function projectState(state: GameState, preset: MtmPreset): MtmPublicState {
    const { config } = state;

    const base: MtmPublicState = {
        preset,
        phase: state.phase === "done" ? "done" : "playing",
        round: state.round,
        totalRounds: TOTAL_ROUNDS,
        communityCount: COMMUNITY_COUNT,

        playerCard: state.playerCard,
        community: state.community.map((card, i) => (i < state.revealed ? card : null)),
        revealed: state.revealed,

        makers: state.makers.map((m) => ({
            id: m.id,
            name: m.name,
            style: m.style,
            description: m.description,
        })),
        quotes: publicQuotes(state),
        activeMaker: state.activeMaker,
        roundActions: state.roundActions as (MtmAction | null)[],

        roundComplete: roundComplete(state),
        isLastRound: isLastRound(state),

        hardMode: config.hardMode,
        expertMode: config.expertMode,
        showEstimate: config.showEstimate,
    };

    if (!config.hardMode) {
        base.position = state.position;
        base.cash = state.cash;
        base.avgEntry = state.avgEntry;
        base.markPnl = markPnl(state);
        base.trades = state.trades;
    }

    if (config.showEstimate) {
        base.fairEstimate = Math.round(playerFair(state));
    }

    return base;
}

/**
 * Full reveal, for the settled screen only. Safe because the hand is over --
 * there is nothing left to exploit.
 */
export function projectSettled(state: GameState, preset: MtmPreset): MtmSettledState {
    const base = projectState(state, preset);
    return {
        ...base,
        phase: "done",
        // The settled screen shows the full picture even in hard mode.
        position: state.position,
        cash: state.cash,
        avgEntry: state.avgEntry,
        trueValue: trueValue(state),
        finalPnl: finalPnl(state),
        makerResults: state.makers.map((m) => ({
            id: m.id,
            name: m.name,
            style: m.style,
            description: m.description,
            card: m.card,
            fills: m.fills,
            inventory: m.inventory,
        })),
        settledCommunity: state.community,
        trades: state.trades,
    };
}
