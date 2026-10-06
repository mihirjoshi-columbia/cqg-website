// Supabase returns at most 1,000 rows per request, silently. Mirrors
// fetchAllPages in lib/supabase/helpers.ts.

export async function fetchAllPages(page) {
    const PAGE = 1000;
    const all = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await page(from, from + PAGE - 1);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < PAGE) return all;
    }
}
