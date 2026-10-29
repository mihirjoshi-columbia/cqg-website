// Filter bar for the admin application pages. A plain GET form: the choices live in the URL
// (?status=offered&type=external&q=chen), so a filtered view can be bookmarked or shared and
// the page stays a server component.

export interface FilterOption {
    value: string;
    label: string;
}

export interface ApplicationFiltersProps {
    /** Status choices with how many applications have each (counted before any filtering). */
    statuses: { value: string; count: number }[];
    /** Optional second dropdown (e.g. applicant type), as options with a name for the URL param. */
    extra?: { name: string; label: string; options: FilterOption[] };
    current: { status: string; q: string; extra: string };
    showing: number;
    total: number;
}

export default function ApplicationFilters({ statuses, extra, current, showing, total }: ApplicationFiltersProps) {
    const filtered = Boolean(current.status || current.q || current.extra);
    return (
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
            <label className="flex flex-col gap-1 text-xs text-ink-faint">
                Status
                <select name="status" defaultValue={current.status} className="field-select" style={{ minWidth: 160 }}>
                    <option value="">All statuses ({statuses.reduce((n, s) => n + s.count, 0)})</option>
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.value} ({s.count})
                        </option>
                    ))}
                </select>
            </label>
            {extra && (
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                    {extra.label}
                    <select name={extra.name} defaultValue={current.extra} className="field-select" style={{ minWidth: 160 }}>
                        <option value="">All</option>
                        {extra.options.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>
            )}
            <label className="flex flex-col gap-1 text-xs text-ink-faint">
                Search name or email
                <input name="q" defaultValue={current.q} className="field-input" placeholder="e.g. chen or @mit.edu" style={{ minWidth: 220 }} />
            </label>
            <button type="submit" className="btn-cqg btn-pink btn-sm">Filter</button>
            {filtered && (
                <a href="?" className="btn-cqg btn-outline-navy btn-sm">Clear</a>
            )}
            <span className="text-ink-faint text-sm ml-auto">
                {filtered ? `Showing ${showing} of ${total}` : `${total} applications`}
            </span>
        </form>
    );
}
