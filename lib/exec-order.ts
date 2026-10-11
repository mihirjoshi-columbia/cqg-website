// Every executive board lists its roles in this order. Co-Presidents sort with
// President; any role not listed (e.g. "Board Member") goes last. Within the
// same role the given order is kept (Array.sort is stable).
const EXEC_ROLE_RANK: Record<string, number> = {
    "President": 0,
    "Co-President": 0,
    "External VP": 1,
    "Internal VP": 2,
    "Co-Head of Education": 3,
    "Marketing & Communications Chair": 4,
};

export function sortByExecRole<T>(items: T[], roleOf: (item: T) => string | undefined): T[] {
    const rank = (item: T) => EXEC_ROLE_RANK[roleOf(item) ?? ""] ?? Object.keys(EXEC_ROLE_RANK).length;
    return [...items].sort((a, b) => rank(a) - rank(b));
}
