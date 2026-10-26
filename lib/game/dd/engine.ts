import {
    afterReveal,
    moments,
    nothingSeen,
    realise,
    type Contract,
    type Moments,
    type Realisation,
} from "./contracts";
import { DD_STAGES, MIN_WIDTH, type DdConfig, type Fill, type FlowEvent, type Quote, type Stage } from "./types";

// Pure reducer for one contract of Distribution Desk.
//
// CRITICAL INVARIANT, the same one lib/game/mtm/replay.ts documents: the
// number of PRNG draws must not depend on anything the player does. Here it
// is satisfied structurally -- `openContract` draws the entire realisation
// AND every counterparty order up front, before the first quote. No state
// transition after that touches the generator at all, so a replay of the same
// seed reproduces exactly what the player saw whatever they quoted.

export interface ContractState {
    contract: Contract;
    realisation: Realisation;
    flow: FlowEvent[][];
    stage: Stage;
    quotes: (Quote | null)[];
    fills: Fill[];
    cash: number;
    inventory: number;
    settled: boolean;
}

function standardNormal(random: () => number): number {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function drawFlow(config: DdConfig, random: () => number): FlowEvent[][] {
    const stages: FlowEvent[][] = [];
    for (let s = 0; s < DD_STAGES; s++) {
        const events: FlowEvent[] = [];
        for (let i = 0; i < config.flowPerStage; i++) {
            // Order matters and must never change: it is the replay contract.
            const informed = random() < config.informedShare;
            const signalNoise = standardNormal(random);
            const participation = random();
            const direction = random();
            events.push({ informed, signalNoise, participation, direction });
        }
        stages.push(events);
    }
    return stages;
}

export function openContract(
    contract: Contract,
    config: DdConfig,
    random: () => number
): ContractState {
    const realisation = realise(contract, random);
    const flow = drawFlow(config, random);
    return {
        contract,
        realisation,
        flow,
        stage: 0,
        quotes: [null, null],
        fills: [],
        cash: 0,
        inventory: 0,
        settled: false,
    };
}

/** How much of each leg the player can see at a given stage. */
export function seenAt(contract: Contract, stage: Stage): number[] {
    return stage === 0 ? nothingSeen(contract) : afterReveal(contract);
}

/** The honest mean and SD at a stage. The player never sees this directly. */
export function momentsAt(state: ContractState, stage: Stage): Moments {
    return moments(state.contract, state.realisation, seenAt(state.contract, stage));
}

export class DdQuoteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DdQuoteError";
    }
}

export function validateQuote(quote: Quote): Quote {
    const { bid, ask } = quote;
    if (!Number.isFinite(bid) || !Number.isFinite(ask)) {
        throw new DdQuoteError("Bid and ask must both be numbers.");
    }
    if (Math.abs(bid) > 1e6 || Math.abs(ask) > 1e6) {
        throw new DdQuoteError("That quote is off the scale.");
    }
    if (ask - bid < MIN_WIDTH) {
        throw new DdQuoteError(`Your ask must be at least ${MIN_WIDTH} above your bid.`);
    }
    // Rounded to a tick so the leaderboard cannot be gamed with sub-cent widths.
    return { bid: Math.round(bid * 100) / 100, ask: Math.round(ask * 100) / 100 };
}

/**
 * Resolves one stage's counterparty orders against the player's quote.
 *
 * Informed orders trade on a noisy view of the SETTLEMENT and only when the
 * quote is wrong in their favour -- this is the adverse selection that
 * punishes a market quoted tighter than the contract's risk warrants.
 *
 * Uninformed orders are the only source of profit. Their participation decays
 * with width, so an over-wide market earns nothing. Between the two, expected
 * P&L peaks at a width proportional to the SD.
 */
export function applyQuote(state: ContractState, rawQuote: Quote, config: DdConfig): ContractState {
    if (state.settled) throw new DdQuoteError("This contract is already settled.");

    const quote = validateQuote(rawQuote);
    const stage = state.stage;
    const { sd } = momentsAt(state, stage);
    const width = quote.ask - quote.bid;
    const settlement = state.realisation.settlement;

    let cash = state.cash;
    let inventory = state.inventory;
    const fills = [...state.fills];

    for (const event of state.flow[stage]!) {
        let counterparty: "buy" | "sell" | null = null;

        if (event.informed) {
            const signal = settlement + event.signalNoise * config.informedNoise * sd;
            if (signal > quote.ask) counterparty = "buy";
            else if (signal < quote.bid) counterparty = "sell";
        } else {
            // A zero-SD contract has no scale to measure width against; treat
            // any width as wide and let participation fall off on an absolute
            // basis instead.
            const scale = sd > 0 ? config.widthTolerance * sd : config.widthTolerance;
            // Squared decay, not plain exponential: participation stays high
            // across sensible widths and then falls away sharply. A plain
            // exponential left a long tail in which quoting three SDs wide
            // still collected most of the available profit, which let a player
            // skip the variance estimate entirely and just quote huge.
            const ratio = width / scale;
            if (event.participation < Math.exp(-ratio * ratio)) {
                counterparty = event.direction < 0.5 ? "buy" : "sell";
            }
        }

        if (counterparty === null) continue;

        // The player takes the other side, so a counterparty buy shortens the
        // player. Orders that would breach the position limit do not fill.
        const delta = counterparty === "buy" ? -1 : 1;
        if (Math.abs(inventory + delta) > config.positionLimit) continue;

        const price = counterparty === "buy" ? quote.ask : quote.bid;
        cash += counterparty === "buy" ? price : -price;
        inventory += delta;
        fills.push({
            contractId: state.contract.id,
            stage,
            counterparty,
            informed: event.informed,
            price,
        });
    }

    const quotes = [...state.quotes];
    quotes[stage] = quote;

    const nextStage = (stage + 1) as Stage;
    const settled = nextStage >= DD_STAGES;

    return {
        ...state,
        quotes,
        fills,
        cash,
        inventory,
        stage: settled ? stage : nextStage,
        settled,
    };
}

/** Marked-to-settlement P&L of one contract. */
export function contractPnl(state: ContractState): number {
    return state.cash + state.inventory * state.realisation.settlement;
}
