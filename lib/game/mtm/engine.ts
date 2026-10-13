import type { Action, Card, Config, Maker, Quote, Side, Trade } from './types'
import {
  COMMUNITY_COUNT,
  MAKER_COUNT,
  TOTAL_ROUNDS,
  buildDeck,
  fairValue,
  shuffle,
} from './deck'
import { applyFill, createMakers, nextFlow, quoteMarkets } from './makers'

export type Phase = 'setup' | 'playing' | 'done'

export interface GameState {
  phase: Phase
  config: Config
  playerCard: Card
  makers: Maker[]
  community: Card[]
  revealed: number
  round: number
  quotes: Quote[]
  /** Index of the maker whose market is live right now. */
  activeMaker: number
  roundActions: (Action | null)[]
  cash: number
  position: number
  avgEntry: number
  flowSignal: number
  trades: Trade[]
}

export const DEFAULT_CONFIG: Config = {
  showEstimate: true,
  hardMode: false,
  expertMode: false,
}

const PLACEHOLDER_CARD: Card = { rank: 1, suit: 'S', value: 10 }

export function initialState(config: Config = DEFAULT_CONFIG): GameState {
  return {
    phase: 'setup',
    config,
    playerCard: PLACEHOLDER_CARD,
    makers: [],
    community: [],
    revealed: 0,
    round: 0,
    quotes: [],
    activeMaker: 0,
    roundActions: [],
    cash: 0,
    position: 0,
    avgEntry: 0,
    flowSignal: 0,
    trades: [],
  }
}

export function playerFair(state: GameState): number {
  return fairValue(state.playerCard, state.community, state.revealed)
}

export function trueValue(state: GameState): number {
  return (
    state.playerCard.value +
    state.makers.reduce((sum, maker) => sum + maker.card.value, 0) +
    state.community.reduce((sum, card) => sum + card.value, 0)
  )
}

/** Mark-to-estimate P&L while the hand is live. */
export function markPnl(state: GameState): number {
  return state.cash + state.position * playerFair(state)
}

export function finalPnl(state: GameState): number {
  return state.cash + state.position * trueValue(state)
}

export function edgeOf(trade: Trade, settle: number): number {
  return trade.side === 'buy' ? settle - trade.price : trade.price - settle
}

export function startGame(config: Config, random: () => number = Math.random): GameState {
  // Both hard and expert mode take the fair-value estimate away.
  const resolved: Config = {
    ...config,
    showEstimate: config.hardMode || config.expertMode ? false : config.showEstimate,
  }

  const deck = shuffle(buildDeck(), random)
  let next = deck.length
  const draw = (): Card => deck[--next]!

  const playerCard = draw()
  const makerCards = Array.from({ length: MAKER_COUNT }, draw)
  const community = Array.from({ length: COMMUNITY_COUNT }, draw)
  const makers = createMakers(makerCards, random)

  const base: GameState = {
    ...initialState(resolved),
    phase: 'playing',
    playerCard,
    makers,
    community,
    roundActions: makers.map(() => null),
  }

  return { ...base, quotes: requote(base, 0, [], random) }
}

function requote(
  state: GameState,
  startIndex: number,
  existingQuotes: Quote[],
  random: () => number = Math.random,
): Quote[] {
  return quoteMarkets({
    makers: state.makers,
    fairValueFor: card => fairValue(card, state.community, state.revealed),
    revealed: state.revealed,
    flowSignal: state.flowSignal,
    expert: state.config.expertMode,
    random,
    startIndex,
    existingQuotes,
  })
}

/**
 * Average-entry bookkeeping: adding to a position blends the price, reducing it
 * keeps the old basis, and flipping through flat re-bases at the fill price.
 */
export function updateCostBasis(
  position: number,
  avgEntry: number,
  side: Side,
  quantity: number,
  price: number,
): { position: number; avgEntry: number } {
  const delta = side === 'buy' ? quantity : -quantity
  const nextPosition = position + delta
  if (position === 0 || Math.sign(position) === Math.sign(delta)) {
    const blended =
      (Math.abs(position) * avgEntry + Math.abs(delta) * price) / Math.abs(nextPosition)
    return { position: nextPosition, avgEntry: blended }
  }
  if (nextPosition === 0) return { position: 0, avgEntry: 0 }
  if (Math.sign(nextPosition) === Math.sign(position)) {
    return { position: nextPosition, avgEntry }
  }
  return { position: nextPosition, avgEntry: price }
}

export function trade(
  state: GameState,
  makerIndex: number,
  side: Side,
  random: () => number = Math.random,
): GameState {
  if (makerIndex !== state.activeMaker) return state
  const quote = state.quotes[makerIndex]
  const maker = state.makers[makerIndex]
  if (!quote || !maker) return state

  const quantity = side === 'buy' ? quote.askSize : quote.bidSize
  const price = side === 'buy' ? quote.ask : quote.bid
  const basis = updateCostBasis(state.position, state.avgEntry, side, quantity, price)

  const makers = state.makers.map((m, i) => (i === makerIndex ? applyFill(m, side, quantity) : m))
  const roundActions = state.roundActions.map((a, i) => (i === makerIndex ? side : a))

  const mid: GameState = {
    ...state,
    makers,
    roundActions,
    cash: state.cash + (side === 'buy' ? -quantity * price : quantity * price),
    position: basis.position,
    avgEntry: basis.avgEntry,
    flowSignal: nextFlow(state.flowSignal, side),
    trades: [
      ...state.trades,
      {
        round: state.round,
        side,
        qty: quantity,
        price,
        counterparty: maker.name,
        style: maker.style,
      },
    ],
  }

  // Makers who have not quoted yet saw the print and adjust to it.
  return {
    ...mid,
    quotes: requote(mid, makerIndex + 1, mid.quotes, random),
    activeMaker: state.activeMaker + 1,
  }
}

export function pass(
  state: GameState,
  makerIndex: number,
  random: () => number = Math.random,
): GameState {
  if (makerIndex !== state.activeMaker) return state
  const mid: GameState = {
    ...state,
    roundActions: state.roundActions.map((a, i) => (i === makerIndex ? 'pass' : a)),
    flowSignal: state.flowSignal * 0.85,
  }
  return {
    ...mid,
    quotes: requote(mid, makerIndex + 1, mid.quotes, random),
    activeMaker: state.activeMaker + 1,
  }
}

export function roundComplete(state: GameState): boolean {
  return state.activeMaker >= state.makers.length
}

export function isLastRound(state: GameState): boolean {
  return state.round === TOTAL_ROUNDS - 1
}

/** Flip the next community card and re-quote, or settle after the last round. */
export function advance(state: GameState, random: () => number = Math.random): GameState {
  if (!roundComplete(state)) return state
  if (isLastRound(state)) {
    return { ...state, revealed: COMMUNITY_COUNT, phase: 'done' }
  }
  const mid: GameState = {
    ...state,
    revealed: state.revealed + 1,
    round: state.round + 1,
    flowSignal: state.flowSignal * 0.55,
  }
  return {
    ...mid,
    quotes: requote(mid, 0, [], random),
    activeMaker: 0,
    roundActions: mid.makers.map(() => null),
  }
}
