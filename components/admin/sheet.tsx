"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, Filter } from "lucide-react";

// Spreadsheet-style columns for the admin application tables: click a header to sort
// (ascending, then descending, then back to the original order) and use the funnel in a header
// to filter that column. Everything runs in the browser on the rows already loaded, and the
// current sort and filters are kept in the URL (?sort=status:asc&f_status=offered,accepted) so a
// view can be bookmarked.

export type FilterKind = "text" | "values" | "date";

export interface ColumnDef<R> {
    key: string;
    label: string;
    /** The text this column sorts and filters on. */
    value: (row: R) => string;
    /** Filtering offered on this column; omit for a sort-only column. */
    filter?: FilterKind;
    /** Sort on this instead of `value` (e.g. a year-then-season key); the filter still uses `value`. */
    sortValue?: (row: R) => string;
    /** Sort by this order instead of alphabetically (values not listed go last, A to Z). */
    order?: string[];
    /** Hide sorting for this column. */
    noSort?: boolean;
}

type Sort = { key: string; dir: "asc" | "desc" } | null;
type Filters = Record<string, { text?: string; values?: string[]; from?: string }>;

function parseState(params: URLSearchParams, columns: ColumnDef<never>[]): { sort: Sort; filters: Filters } {
    let sort: Sort = null;
    const raw = params.get("sort");
    if (raw) {
        const [key, dir] = raw.split(":");
        if (columns.some((c) => c.key === key) && (dir === "asc" || dir === "desc")) sort = { key, dir };
    }
    const filters: Filters = {};
    for (const c of columns) {
        const v = params.get(`f_${c.key}`);
        if (!v) continue;
        if (c.filter === "values") filters[c.key] = { values: v.split("|") };
        else if (c.filter === "date") filters[c.key] = { from: v };
        else filters[c.key] = { text: v };
    }
    return { sort, filters };
}

function isActive(f: Filters[string] | undefined): boolean {
    return Boolean(f && (f.text || f.from || (f.values && f.values.length)));
}

function matches<R>(row: R, columns: ColumnDef<R>[], filters: Filters, skip?: string): boolean {
    for (const c of columns) {
        if (c.key === skip) continue;
        const f = filters[c.key];
        if (!isActive(f)) continue;
        const v = c.value(row);
        if (f.values?.length && !f.values.includes(v)) return false;
        if (f.text && !v.toLowerCase().includes(f.text.trim().toLowerCase())) return false;
        if (f.from && v.slice(0, 10) < f.from) return false;
    }
    return true;
}

export function useSheet<R>(rows: R[], columns: ColumnDef<R>[]) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [initial] = useState(() => parseState(params, columns as ColumnDef<never>[]));
    const [sort, setSort] = useState<Sort>(initial.sort);
    const [filters, setFilters] = useState<Filters>(initial.filters);

    // Keep the URL in step (replace, so the back button isn't flooded).
    useEffect(() => {
        const next = new URLSearchParams();
        if (sort) next.set("sort", `${sort.key}:${sort.dir}`);
        for (const c of columns) {
            const f = filters[c.key];
            if (!isActive(f)) continue;
            next.set(`f_${c.key}`, f.values?.length ? f.values.join("|") : (f.text ?? f.from ?? ""));
        }
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [sort, filters]); // eslint-disable-line react-hooks/exhaustive-deps

    const shown = useMemo(() => {
        const kept = rows.filter((r) => matches(r, columns, filters));
        if (!sort) return kept;
        const col = columns.find((c) => c.key === sort.key);
        if (!col) return kept;
        const rank = (v: string) => {
            if (!col.order) return 0;
            const i = col.order.indexOf(v);
            return i === -1 ? col.order.length : i;
        };
        const sign = sort.dir === "asc" ? 1 : -1;
        return [...kept].sort((a, b) => {
            const av = (col.sortValue ?? col.value)(a), bv = (col.sortValue ?? col.value)(b);
            // Blank cells go to the bottom whichever way you sort.
            if (!av !== !bv) return av ? -1 : 1;
            return sign * ((col.order ? rank(col.value(a)) - rank(col.value(b)) : 0) || av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }));
        });
    }, [rows, columns, filters, sort]);

    const filterCount = columns.filter((c) => isActive(filters[c.key])).length;

    return {
        shown,
        sort,
        filters,
        filterCount,
        cycleSort: (key: string) =>
            setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null)),
        setFilter: (key: string, value: Filters[string]) => setFilters((f) => ({ ...f, [key]: value })),
        clear: () => {
            setFilters({});
            setSort(null);
        },
        // Values for a "values" filter, counted over the rows that pass every OTHER column's filter.
        optionsFor: (col: ColumnDef<R>) => {
            const counts = new Map<string, number>();
            for (const r of rows) if (matches(r, columns, filters, col.key)) counts.set(col.value(r), (counts.get(col.value(r)) ?? 0) + 1);
            const vals = [...counts.keys()];
            const rank = (v: string) => (col.order ? (col.order.indexOf(v) === -1 ? col.order.length : col.order.indexOf(v)) : 0);
            vals.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
            return vals.map((v) => ({ value: v, count: counts.get(v) ?? 0 }));
        },
    };
}

export type SheetApi<R> = ReturnType<typeof useSheet<R>>;

function FilterPopover<R>({ col, sheet, onClose }: { col: ColumnDef<R>; sheet: SheetApi<R>; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const f = sheet.filters[col.key] ?? {};

    useEffect(() => {
        const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [onClose]);

    let body: ReactNode = null;
    if (col.filter === "values") {
        const options = sheet.optionsFor(col);
        const chosen = f.values ?? [];
        const visible = options.filter((o) => o.value.toLowerCase().includes(query.trim().toLowerCase()));
        const toggle = (v: string) => sheet.setFilter(col.key, { values: chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v] });
        body = (
            <>
                {options.length > 8 && (
                    <input className="field-input" placeholder="Search values…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 8 }} />
                )}
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {visible.map((o) => (
                        <label key={o.value} className="flex items-center gap-2 text-sm py-0.5" style={{ whiteSpace: "nowrap" }}>
                            <input type="checkbox" checked={chosen.includes(o.value)} onChange={() => toggle(o.value)} />
                            <span>{o.value || "(blank)"}</span>
                            <span className="text-ink-faint text-xs ml-auto pl-3">{o.count}</span>
                        </label>
                    ))}
                    {visible.length === 0 && <p className="text-ink-faint text-xs">No matches.</p>}
                </div>
            </>
        );
    } else if (col.filter === "date") {
        body = (
            <label className="text-xs text-ink-faint flex flex-col gap-1">
                From date
                <input type="date" className="field-input" value={f.from ?? ""} onChange={(e) => sheet.setFilter(col.key, { from: e.target.value })} />
            </label>
        );
    } else {
        body = (
            <input
                autoFocus
                className="field-input"
                placeholder="Type to match…"
                value={f.text ?? ""}
                onChange={(e) => sheet.setFilter(col.key, { text: e.target.value })}
            />
        );
    }

    return (
        <div
            ref={ref}
            style={{ position: "absolute", top: "100%", left: 0, zIndex: 30, minWidth: 220, background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: 12, textAlign: "left", fontWeight: 400 }}
        >
            {body}
            <div className="flex justify-between mt-2">
                <button type="button" className="text-xs text-pink-deep font-semibold" onClick={() => sheet.setFilter(col.key, {})}>
                    Clear
                </button>
                <button type="button" className="text-xs text-navy font-semibold" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
}

export function SheetHeader<R>({ col, sheet }: { col: ColumnDef<R>; sheet: SheetApi<R> }) {
    const [open, setOpen] = useState(false);
    const sorted = sheet.sort?.key === col.key ? sheet.sort.dir : null;
    const filtered = isActive(sheet.filters[col.key]);
    const SortIcon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

    return (
        <th style={{ position: "relative", whiteSpace: "nowrap" }}>
            <span className="inline-flex items-center gap-1">
                {col.noSort ? (
                    <span>{col.label}</span>
                ) : (
                    <button type="button" onClick={() => sheet.cycleSort(col.key)} className="inline-flex items-center gap-1 font-bold" aria-label={`Sort by ${col.label}`}>
                        {col.label}
                        <SortIcon size={13} style={{ opacity: sorted ? 1 : 0.35 }} />
                    </button>
                )}
                {col.filter && (
                    <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Filter ${col.label}`} className="inline-flex" style={{ color: filtered ? "var(--pink-deep)" : undefined, opacity: filtered ? 1 : 0.45 }}>
                        <Filter size={13} fill={filtered ? "currentColor" : "none"} />
                    </button>
                )}
            </span>
            {open && <FilterPopover col={col} sheet={sheet} onClose={() => setOpen(false)} />}
        </th>
    );
}

export function SheetToolbar<R>({ sheet, total, exportHref }: { sheet: SheetApi<R>; total: number; exportHref: string }) {
    const narrowed = sheet.filterCount > 0;
    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="text-ink-faint text-sm">
                {narrowed ? `Showing ${sheet.shown.length} of ${total} applications` : `${total} applications`}
            </p>
            {(narrowed || sheet.sort) && (
                <button type="button" onClick={sheet.clear} className="btn-cqg btn-outline-navy btn-sm">
                    Clear filters
                </button>
            )}
            <a href={exportHref} className="btn-cqg btn-outline-navy btn-sm ml-auto">
                Export CSV
            </a>
        </div>
    );
}
