const YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];

// Chronological within each calendar year: Spring (e.g. May) precedes Fall
// (e.g. December) of the same year.
export const GRAD_YEARS: string[] = YEARS.flatMap((y) => [`Spring ${y}`, `Fall ${y}`]);
