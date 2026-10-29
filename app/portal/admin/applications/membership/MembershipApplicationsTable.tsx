"use client";

import { SheetHeader, SheetToolbar, useSheet, type ColumnDef } from "@/components/admin/sheet";
import DecisionButtons from "./DecisionButtons";

export interface MembershipRow {
    id: string;
    profileId: string;
    applicantName: string;
    applicantEmail: string;
    school: string;
    accomplishments: string[];
    cycle: string;
    submittedAt: string;
    status: string;
}

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-lime",
    rejected: "tag-outline",
};

const COLUMNS: ColumnDef<MembershipRow>[] = [
    { key: "applicant", label: "Applicant", value: (r) => `${r.applicantName} — ${r.applicantEmail}`, filter: "text" },
    { key: "school", label: "School", value: (r) => r.school, filter: "values" },
    { key: "accomplishments", label: "Accomplishments", value: (r) => r.accomplishments.join(" "), noSort: true },
    { key: "cycle", label: "Cycle", value: (r) => r.cycle, noSort: true },
    { key: "submitted", label: "Submitted", value: (r) => r.submittedAt, filter: "date" },
    { key: "status", label: "Status", value: (r) => r.status, filter: "values", order: ["pending", "approved", "rejected"] },
];

export default function MembershipApplicationsTable({ rows }: { rows: MembershipRow[] }) {
    const sheet = useSheet(rows, COLUMNS);

    return (
        <div>
            <SheetToolbar sheet={sheet} total={rows.length} exportHref="/api/admin/membership-applications/export" />
            <div style={{ overflowX: "auto", minHeight: 320 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((c) => (
                                <SheetHeader key={c.key} col={c} sheet={sheet} />
                            ))}
                            <th>Decide</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sheet.shown.map((r) => (
                            <tr key={r.id}>
                                <td>{r.applicantName ? `${r.applicantName} — ${r.applicantEmail}` : r.profileId}</td>
                                <td>{r.school}</td>
                                <td style={{ minWidth: 260 }}>
                                    <ul className="text-xs" style={{ paddingLeft: "1rem", listStyle: "disc" }}>
                                        {r.accomplishments.map((a, i) => (
                                            <li key={i}>{a}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td>{r.cycle}</td>
                                <td className="text-xs">{new Date(r.submittedAt).toLocaleDateString()}</td>
                                <td><span className={`tag ${STATUS_TAG[r.status]}`}>{r.status}</span></td>
                                <td>
                                    {r.status === "pending" ? (
                                        <DecisionButtons applicationId={r.id} applicantId={r.profileId} />
                                    ) : (
                                        <span className="text-ink-faint text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sheet.shown.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length + 1} className="text-ink-faint text-sm">No applications match these filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
