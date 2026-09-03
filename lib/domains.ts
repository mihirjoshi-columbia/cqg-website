// Email-domain gating for the two account universes. CQG accounts are
// columbia.edu / barnard.edu exactly; CUTC accounts are any other .edu.
// Deliberately an exact-domain match (not "ends with columbia.edu"), so a
// hypothetical subdomain like law.columbia.edu would currently be treated as
// CUTC-eligible rather than CQG — matches what was actually specified
// ("columbia.edu or barnard.edu emails" / "any .edu, but NOT columbia or
// barnard"), not a broader "anything under columbia.edu" rule.
const CQG_DOMAINS = ["columbia.edu", "barnard.edu"];

export function emailDomain(email: string): string {
    return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isCqgEmail(email: string): boolean {
    return CQG_DOMAINS.includes(emailDomain(email));
}

export function isCutcEmail(email: string): boolean {
    const domain = emailDomain(email);
    return domain.endsWith(".edu") && !CQG_DOMAINS.includes(domain);
}
