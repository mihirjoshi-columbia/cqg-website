/** Rounded, thousands-separated, with a proper minus sign. */
export function fmt(n: number): string {
  return (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString()
}
