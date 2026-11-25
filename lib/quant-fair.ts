// The inaugural Columbia Quant Fair. The homepage banner and hero button and the portal
// dashboard card all read from here, and hide themselves once the fair is over.

export const QUANT_FAIR_TITLE = "Columbia Quant Fair";
export const QUANT_FAIR_LOCATION = "Low Library";
// December 5, 2026, 2:30-4:00 PM ET (EST, UTC-5).
export const QUANT_FAIR_STARTS_AT = "2026-12-05T19:30:00Z";
export const QUANT_FAIR_ENDS_AT = "2026-12-05T21:00:00Z";
export const QUANT_FAIR_WHEN = "Dec 5, 2:30–4 PM ET";
export const QUANT_FAIR_BLURB =
    "The inaugural Columbia Quant Fair: sponsor networking and exclusive merch. Open to all Columbia and Barnard students, undergraduate and graduate.";

// Where visitors go to RSVP: you need a CQG account (columbia.edu or barnard.edu email).
// The "rsvp" param makes the signup and log-in pages show the step-by-step guide.
export const QUANT_FAIR_RSVP_PARAM = "quant-fair";
export const QUANT_FAIR_RSVP_HREF = `/portal/signup?rsvp=${QUANT_FAIR_RSVP_PARAM}`;

export const quantFairOver = (now: Date = new Date()) => now.getTime() >= new Date(QUANT_FAIR_ENDS_AT).getTime();

export const isQuantFairEvent = (title: string) => title.trim().toLowerCase() === QUANT_FAIR_TITLE.toLowerCase();
