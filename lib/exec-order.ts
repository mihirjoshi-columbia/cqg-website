// Every board lists its roles in this order. Co-Presidents sort with President;
// any role not listed (e.g. "Board Member") goes last. Matching is by keyword
// against the role's segments (split on " · "), so "VP · Co-President (Spring 2020)"
// ranks by its first matching segment, "VP". Within the same rank the given order
// is kept (Array.sort is stable), unless the caller also passes a name.
const ROLE_ORDER = [
    "president",
    "external vp",
    "internal vp",
    "vp",
    "treasurer",
    "co-head",
    "head of",
    "education",
    "research",
    "events",
    "funding",
    "tech",
    "social",
    "marketing",
    "campus",
];

function rankOf(role: string | undefined): number {
    for (const segment of (role ?? "").toLowerCase().split("·")) {
        const index = ROLE_ORDER.findIndex((keyword) => segment.includes(keyword));
        if (index !== -1) return index;
    }
    return ROLE_ORDER.length;
}

export function sortByExecRole<T>(
    items: T[],
    roleOf: (item: T) => string | undefined,
    thenByName?: (item: T) => string
): T[] {
    return [...items].sort(
        (a, b) =>
            rankOf(roleOf(a)) - rankOf(roleOf(b)) ||
            (thenByName ? thenByName(a).localeCompare(thenByName(b)) : 0)
    );
}
