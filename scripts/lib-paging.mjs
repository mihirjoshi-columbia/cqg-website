// Supabase returns at most 1,000 rows per request, silently, and rejects
// `.in("id", [...])` once the id list is long enough to overrun the URL. The
// one-off scripts hit both at CTT scale. Mirrors lib/supabase/helpers.ts.

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

export async function fetchByIds(ids, lookup, chunkSize = 100) {
    const out = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
        const { data, error } = await lookup(ids.slice(i, i + chunkSize));
        if (error) throw error;
        out.push(...(data ?? []));
    }
    return out;
}
