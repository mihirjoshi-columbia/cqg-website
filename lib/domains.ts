// Email-domain gating for the two account universes. CQG accounts are
// columbia.edu / barnard.edu exactly; CUTC accounts are any other .edu.
// Deliberately an exact-domain match (not "ends with columbia.edu"), so a
// hypothetical subdomain like law.columbia.edu would currently be treated as
// CUTC-eligible rather than CQG — matches what was actually specified
// ("columbia.edu or barnard.edu emails" / "any .edu, but NOT columbia or
// barnard"), not a broader "anything under columbia.edu" rule.
const CQG_DOMAINS = ["columbia.edu", "barnard.edu"];

// Columbia/Barnard's UNI convention: 2-3 letters followed by exactly 4
// digits (e.g. "abc1234"), nothing else in the local part.
const UNI_PATTERN = /^[a-z]{2,3}[0-9]{4}$/;

export function emailDomain(email: string): string {
    return email.trim().toLowerCase().split("@")[1] ?? "";
}

function emailLocalPart(email: string): string {
    return email.trim().toLowerCase().split("@")[0] ?? "";
}

// Domain match only — use isCqgEmail for the full (domain + UNI format)
// check. Exposed separately so callers can give a more specific error for
// "right domain, wrong UNI format" vs. "wrong domain entirely."
export function isCqgDomain(email: string): boolean {
    return CQG_DOMAINS.includes(emailDomain(email));
}

export function isCqgUniFormat(email: string): boolean {
    return UNI_PATTERN.test(emailLocalPart(email));
}

export function isCqgEmail(email: string): boolean {
    return isCqgDomain(email) && isCqgUniFormat(email);
}

export function isCutcEmail(email: string): boolean {
    const domain = emailDomain(email);
    return domain.endsWith(".edu") && !CQG_DOMAINS.includes(domain);
}

// A CQG member's "College/University" on a CUTC application is fixed to
// their verified school, not freely chosen — Barnard students attend
// Barnard College; every other CQG school value is Columbia University.
export function cqgSchoolToCollegeName(school: string): string {
    return school === "Barnard" ? "Barnard College" : "Columbia University";
}
