// A member's first year in CQG, worked out from the member lists on the
// Members page: the earliest year they appear in any list (internal members
// or executive board). A year means the calendar/academic year it starts in
// (2026 = the 2026 board and 2026–27 internal members).
//
// The page only goes back to 2023 and some older lists are incomplete, so this
// is a starting point; correct it in FIRST_YEAR_OVERRIDES (app/members/page.tsx).

export interface YearList {
    year: number;
    names: string[];
}

export function firstYearByName(lists: YearList[], overrides: Record<string, number> = {}): Map<string, number> {
    const first = new Map<string, number>();
    for (const { year, names } of lists) {
        for (const name of names) {
            const seen = first.get(name);
            if (seen === undefined || year < seen) first.set(name, year);
        }
    }
    for (const [name, year] of Object.entries(overrides)) first.set(name, year);
    return first;
}

// Tags each person with whether this list is their first year.
export function markFirstYear<T extends { name: string }>(
    items: T[],
    year: number,
    first: Map<string, number>
): (T & { firstYear: boolean })[] {
    return items.map((item) => ({ ...item, firstYear: first.get(item.name) === year }));
}
