"use client";

import { SheetHeader, SheetToolbar, useSheet, type ColumnDef } from "@/components/admin/sheet";
import TierSelect from "./TierSelect";
import ViewResumeButton from "./ViewResumeButton";
import type { CqgTier } from "@/lib/supabase/types";

export interface MemberRow {
    id: string;
    name: string;
    email: string;
    school: string;
    year: string;
    major: string;
    hasResume: boolean;
    tier: CqgTier;
}

const TIER_LABEL: Record<CqgTier, string> = {
    general_body: "General Body",
    member: "Internal Member",
    senior_advisor: "Senior Advisor",
    admin: "Admin",
};
const TIER_ORDER = ["Admin", "Senior Advisor", "Internal Member", "General Body"];

const COLUMNS: ColumnDef<MemberRow>[] = [
    { key: "name", label: "Name", value: (r) => r.name, filter: "text" },
    { key: "email", label: "Email", value: (r) => r.email, filter: "text" },
    { key: "school", label: "School", value: (r) => r.school, filter: "values" },
    { key: "year", label: "Year", value: (r) => r.year, filter: "values" },
    { key: "major", label: "Major", value: (r) => r.major, noSort: true },
    { key: "resume", label: "Resume", value: (r) => (r.hasResume ? "Yes" : "No"), noSort: true },
    { key: "tier", label: "Tier", value: (r) => TIER_LABEL[r.tier], filter: "values", order: TIER_ORDER },
];

export default function MembersTable({ rows }: { rows: MemberRow[] }) {
    const sheet = useSheet(rows, COLUMNS);

    // Export only the rows currently shown, so the CSV matches the filters on screen.
    async function exportShown() {
        const res = await fetch("/api/admin/members/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: sheet.shown.map((r) => r.id) }),
        });
        if (!res.ok) {
            window.alert("The export failed. Try again.");
            return;
        }
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = sheet.filterCount > 0 ? "cqg-members-filtered.csv" : "cqg-members.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <SheetToolbar sheet={sheet} total={rows.length} noun="accounts" onExport={exportShown} />
            <div style={{ overflowX: "auto", minHeight: 320 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((c) => (
                                <SheetHeader key={c.key} col={c} sheet={sheet} />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sheet.shown.map((m) => (
                            <tr key={m.id}>
                                <td>{m.name}</td>
                                <td>{m.email}</td>
                                <td>{m.school}</td>
                                <td>{m.year}</td>
                                <td>{m.major}</td>
                                <td>{m.hasResume ? <ViewResumeButton profileId={m.id} /> : <span className="text-ink-faint text-xs">None</span>}</td>
                                <td><TierSelect profileId={m.id} currentTier={m.tier} /></td>
                            </tr>
                        ))}
                        {sheet.shown.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} className="text-ink-faint text-sm">No accounts match these filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
