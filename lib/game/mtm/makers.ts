import type { Card, Config, Maker, MakerProfile, Quote, Side } from './types'
import { shuffle } from './deck'

/**
 * Four quoting styles. Each one values its own private card correctly but
 * differs in how much it trusts the mids already on the screen, how it reacts
 * to your order flow, and how far it skews when it is carrying inventory.
 */
export const MAKER_PROFILES: readonly MakerProfile[] = [
  {
    id: 'tight',
    name: 'Nadia',
    style: 'Tight maker',
    description: 'Backs her own read and quotes right up against fair value.',
    baseWidth: 8,
    informationWeight: 0.52,
    flowSensitivity: 0.14,
    inventoryAversion: 1.8,
    noise: 0.5,
  },
  {
    id: 'wide',
    name: 'Harlan',
    style: 'Wide maker',
    description: 'Charges for uncertainty and shows a much wider market.',
    baseWidth: 28,
    informationWeight: 0.12,
    flowSensitivity: 0.07,
    inventoryAversion: 0.7,
    noise: 2.0,
  },
  {
    id: 'flow',
    name: 'Imani',
    style: 'Flow reader',
    description: 'Leans hard into whichever way you have been trading.',
    baseWidth: 14,
    informationWeight: 0.3,
    flowSensitivity: 0.62,
    inventoryAversion: 1.1,
    noise: 1.0,
  },
  {
    id: 'contrarian',
    name: 'Rooke',
    style: 'Contrarian',
    description: 'Fades your order flow rather than chasing it.',
    baseWidth: 20,
    informationWeight: 0.24,
    flowSensitivity: -0.32,
    inventoryAversion: 1.4,
    noise: 1.3,
  },
]

export function createMakers(cards: Card[], random: () => number = Math.random): Maker[] {
  if (cards.length < MAKER_PROFILES.length) {
    throw new Error('Every market maker needs a private card.')
  }
  return shuffle(MAKER_PROFILES.slice(), random).map((profile, index) => ({
    ...profile,
    card: cards[index]!,
    inventory: 0,
    fills: 0,
  }))
}

interface QuoteArgs {
  makers: Maker[]
  fairValueFor: (card: Card) => number
  revealed: number
  flowSignal: number
  expert: boolean
  random?: () => number
  /** Makers before this index keep the quote they already showed. */
  startIndex?: number
  existingQuotes?: Quote[]
}

/**
 * Quotes run left to right: each maker sees the mids of the makers who already
 * spoke this round and blends them into its own private fair value.
 */
export function quoteMarkets({
  makers,
  fairValueFor,
  revealed,
  flowSignal,
  expert,
  random = Math.random,
  startIndex = 0,
  existingQuotes = [],
}: QuoteArgs): Quote[] {
  const quotes: Quote[] = []
  const priorMids: number[] = []

  makers.forEach((maker, index) => {
    const existing = existingQuotes[index]
    if (index < startIndex && existing) {
      quotes.push({ ...existing })
      priorMids.push((existing.bid + existing.ask) / 2)
      return
    }

    const privateFair = fairValueFor(maker.card)
    let mid = privateFair

    if (priorMids.length) {
      const observedMid = priorMids.reduce((sum, value) => sum + value, 0) / priorMids.length
      const weight = Math.min(0.72, maker.informationWeight * (expert ? 1.35 : 0.55))
      mid = privateFair * (1 - weight) + observedMid * weight
    }

    const flowStrength = expert ? 1 : 0.42
    mid += flowSignal * maker.flowSensitivity * maker.baseWidth * flowStrength
    mid -= maker.inventory * maker.inventoryAversion
    mid += (random() - 0.5) * 2 * maker.noise

    // Spreads tighten as community cards come out, and again in expert mode.
    const uncertainty = Math.max(0.55, 1 - revealed * 0.1)
    const modeFactor = expert ? 0.72 : 1
    const halfWidth = Math.max(1, Math.round((maker.baseWidth * uncertainty * modeFactor) / 2))

    const bid = Math.floor(mid - halfWidth)
    let ask = Math.ceil(mid + halfWidth)
    if (ask <= bid) ask = bid + 1

    quotes.push({ bid, ask, bidSize: 1, askSize: 1, mid, privateFair })
    priorMids.push((bid + ask) / 2)
  })

  return quotes
}

/** A fill leaves the maker with the opposite side of your trade. */
export function applyFill(maker: Maker, side: Side, quantity = 1): Maker {
  return {
    ...maker,
    inventory: maker.inventory + (side === 'buy' ? -quantity : quantity),
    fills: maker.fills + 1,
  }
}

/** Decaying, clamped signal of which way you have been trading. */
export function nextFlow(flow: number, side: Side): number {
  const direction = side === 'buy' ? 1 : -1
  return Math.max(-3, Math.min(3, flow * 0.65 + direction))
}

export function makerFairSpread(config: Config): boolean {
  return !config.hardMode && config.showEstimate
}
