// Email-domain gating for the two account universes. CQG accounts are
// columbia.edu / barnard.edu exactly; CUTC accounts are everyone else.
// Deliberately an exact-domain match (not "ends with columbia.edu"), so a
// hypothetical subdomain like law.columbia.edu would currently be treated as
// CUTC-eligible rather than CQG — matches what was actually specified
// ("columbia.edu or barnard.edu emails" / "any .edu, but NOT columbia or
// barnard"), not a broader "anything under columbia.edu" rule.
const CQG_DOMAINS = ["columbia.edu", "barnard.edu"];

export function emailDomain(email: string): string {
    return email.trim().toLowerCase().split("@")[1] ?? "";
}

// The only check that should ever gate a *login*: which of the two portals
// this address belongs to. Anything stricter re-validates an account against
// rules that may not have existed when it was created — see the note below on
// the UNI-format check that used to run here and locked existing users out.
export function isCqgDomain(email: string): boolean {
    return CQG_DOMAINS.includes(emailDomain(email));
}

// NOTE: there is deliberately no UNI-format check (2-3 letters + 4 digits on
// the local part) anywhere in this file any more. Barnard addresses are
// typically firstname.lastname@barnard.edu and Columbia hands out name
// aliases as well, so that pattern rejected large numbers of real students —
// and because it was applied at login too, it locked existing accounts out.

// Student-email check for CUTC *signup*. ".edu" alone excluded every
// international applicant (.ac.uk, .edu.cn, .edu.au, .ac.jp, ...), so match
// the common academic patterns instead of the US-only one. Non-academic
// domains that slip through are caught by the attestation checkbox and by
// admin review of applications — a false reject costs an applicant entirely,
// a false accept costs one manual rejection.
const ACADEMIC_PATTERNS = [
    /\.edu$/, // US
    /\.edu\.[a-z]{2,}$/, // .edu.cn, .edu.au, .edu.sg, ...
    /\.ac\.[a-z]{2,}$/, // .ac.uk, .ac.jp, .ac.kr, ...
    /\.ac$/,
    /\.uni-[a-z-]+\.[a-z]{2,}$/, // German uni-*.de style
];

function isAcademicEmail(email: string): boolean {
    const domain = emailDomain(email);
    return ACADEMIC_PATTERNS.some((p) => p.test(domain));
}

// Signup-time gate for CUTC: an academic address that isn't a CQG one.
export function isCutcEmail(email: string): boolean {
    return isAcademicEmail(email) && !isCqgDomain(email);
}

// Login-time gate for CUTC: portal routing only, no academic-domain check.
// An account that already exists must be able to get back into it even if
// the signup rules have tightened since.
export function isCutcLoginDomain(email: string): boolean {
    return !isCqgDomain(email);
}

// A CQG member's "College/University" on a CUTC application is fixed to
// their verified school, not freely chosen — Barnard students attend
// Barnard College; every other CQG school value is Columbia University.
export function cqgSchoolToCollegeName(school: string | null): string {
    return school === "Barnard" ? "Barnard College" : "Columbia University";
}
