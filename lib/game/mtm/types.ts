export type Suit = 'S' | 'C' | 'D'

export interface Card {
  rank: number // 1 = A .. 13 = K
  suit: Suit
  value: number // black: rank * 10, diamonds: rank * -10
}

export interface MakerProfile {
  id: string
  name: string
  style: string
  description: string
  /** Full width of the market this maker shows when nothing is known. */
  baseWidth: number
  /** How much weight it puts on mids already shown this round. */
  informationWeight: number
  /** Positive = chases your flow, negative = fades it. */
  flowSensitivity: number
  /** Price skew per lot of inventory it is carrying. */
  inventoryAversion: number
  /** Random jitter on the mid, in points. */
  noise: number
}

export interface Maker extends MakerProfile {
  card: Card
  /** Lots the maker is holding; the mirror image of your fills. */
  inventory: number
  fills: number
}

export interface Quote {
  bid: number
  ask: number
  bidSize: number
  askSize: number
  mid: number
  privateFair: number
}

export type Side = 'buy' | 'sell'
export type Action = Side | 'pass'

export interface Trade {
  round: number
  side: Side
  qty: number
  price: number
  counterparty: string
  style: string
}

export interface Config {
  showEstimate: boolean
  hardMode: boolean
  expertMode: boolean
}
