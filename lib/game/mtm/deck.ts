import type { Card, Suit } from './types'

export const SUITS: Suit[] = ['S', 'C', 'D'] // hearts are removed from the deck
export const TOTAL_ROUNDS = 5
export const COMMUNITY_COUNT = 4
export const MAKER_COUNT = 4
/** Cards that settle but are unknown at the start: 4 makers + 4 community. */
export const DEALT_UNKNOWN = MAKER_COUNT + COMMUNITY_COUNT

export function cardValue(rank: number, suit: Suit): number {
  return suit === 'D' ? -10 * rank : 10 * rank
}

export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ rank, suit, value: cardValue(rank, suit) })
    }
  }
  return deck
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const a = out[i]!
    const b = out[j]!
    out[i] = b
    out[j] = a
  }
  return out
}

export const DECK_SUM = buildDeck().reduce((sum, card) => sum + card.value, 0)
export const DECK_COUNT = 39

/** Mean value of a card still unaccounted for, given everything already known. */
export function poolMean(excluded: Card[]): number {
  let sum = DECK_SUM
  let count = DECK_COUNT
  for (const card of excluded) {
    sum -= card.value
    count -= 1
  }
  return count > 0 ? sum / count : 0
}

/**
 * Expected settlement value of all nine dealt cards from the point of view of
 * someone holding `ownCard` who can see the first `revealed` community cards.
 */
export function fairValue(ownCard: Card, community: Card[], revealed: number): number {
  const shown = community.slice(0, revealed)
  const known = ownCard.value + shown.reduce((sum, card) => sum + card.value, 0)
  const unknown = DEALT_UNKNOWN - revealed
  return known + unknown * poolMean([ownCard, ...shown])
}

export const RANK_LABELS: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }

export function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank)
}

export function suitSymbol(suit: Suit): string {
  return suit === 'S' ? '♠' : suit === 'C' ? '♣' : '♦'
}
