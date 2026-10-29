"use client";

import { SheetHeader, SheetToolbar, useSheet, type ColumnDef } from "@/components/admin/sheet";
import DecisionButtons from "./DecisionButtons";
import ViewResumeButton from "./ViewResumeButton";
import type { CttApplicationStatus } from "@/lib/supabase/types";

export interface CttRow {
    id: string;
    applicantName: string;
    applicantEmail: string;
    applicantType: "cqg_member" | "external";
    college: string;
    major: string;
    gradYear: string;
    gender: string;
    priorInternship: boolean;
    internshipLinedUp: boolean;
    internshipLocation: string | null;
    travel: string;
    lodging: string;
    cycle: string;
    hasResume: boolean;
    cqgProfileId: string | null;
    cttProfileId: string | null;
    status: CttApplicationStatus;
    detailsComplete: boolean;
    offerExpiresAt: string | null;
}

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    offered: "tag-lime",
    accepted: "tag-pink",
    approved: "tag-pink",
    declined: "tag-outline",
    expired: "tag-outline",
    rejected: "tag-outline",
};

// Sorting by Status groups live offers first, then their outcomes, then everyone still waiting or turned down.
const STATUS_ORDER = ["offered", "accepted", "approved", "declined", "expired", "pending", "rejected"];

const typeLabel = (r: CttRow) => (r.applicantType === "cqg_member" ? "CQG member" : "External");
// "Spring 2028" -> "2028-0", "Fall 2028" -> "2028-1": by year, then Spring before Fall.
const gradSortKey = (r: CttRow) => {
    const m = r.gradYear.match(/(Spring|Fall)\s+(\d{4})/);
    return m ? `${m[2]}-${m[1] === "Spring" ? 0 : 1}` : r.gradYear;
};

const COLUMNS: ColumnDef<CttRow>[] = [
    { key: "applicant", label: "Applicant", value: (r) => `${r.applicantName} — ${r.applicantEmail}`, filter: "text" },
    { key: "type", label: "Type", value: typeLabel, filter: "values" },
    { key: "college", label: "College", value: (r) => r.college, filter: "values" },
    { key: "major", label: "Major", value: (r) => r.major, noSort: true },
    { key: "grad", label: "Grad Yr", value: (r) => r.gradYear, sortValue: gradSortKey, filter: "values" },
    { key: "gender", label: "Gender", value: (r) => r.gender, noSort: true },
    { key: "prior", label: "Prior Intern?", value: (r) => (r.priorInternship ? "Yes" : "No"), noSort: true },
    { key: "lined", label: "Lined Up?", value: (r) => (r.internshipLinedUp ? "Yes" : "No"), noSort: true },
    { key: "where", label: "Where", value: (r) => r.internshipLocation ?? "", noSort: true },
    { key: "travel", label: "Travel?", value: (r) => r.travel, noSort: true },
    { key: "lodging", label: "Lodging?", value: (r) => r.lodging, noSort: true },
    { key: "cycle", label: "Cycle", value: (r) => r.cycle, noSort: true },
    { key: "resume", label: "Resume", value: (r) => (r.hasResume ? "Yes" : "No"), noSort: true },
    { key: "status", label: "Status", value: (r) => r.status, filter: "values", order: STATUS_ORDER },
];

export default function CttApplicationsTable({ rows }: { rows: CttRow[] }) {
    const sheet = useSheet(rows, COLUMNS);

    return (
        <div>
            <SheetToolbar sheet={sheet} total={rows.length} exportHref="/api/admin/ctt-applications/export" />
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
                                <td>{r.applicantName ? `${r.applicantName} — ${r.applicantEmail}` : "—"}</td>
                                <td>
                                    <span className="tag tag-outline" style={{ fontSize: "0.68rem" }}>{typeLabel(r)}</span>
                                </td>
                                <td>{r.college}</td>
                                <td>{r.major}</td>
                                <td>{r.gradYear}</td>
                                <td>{r.gender}</td>
                                <td>{r.priorInternship ? "Yes" : "No"}</td>
                                <td>{r.internshipLinedUp ? "Yes" : "No"}</td>
                                <td>{r.internshipLocation ?? "—"}</td>
                                <td>{r.travel}</td>
                                <td>{r.lodging}</td>
                                <td>{r.cycle}</td>
                                <td>
                                    {r.hasResume ? (
                                        <ViewResumeButton applicantType={r.applicantType} cqgProfileId={r.cqgProfileId} cttProfileId={r.cttProfileId} />
                                    ) : (
                                        <span className="text-ink-faint text-xs">None</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`tag ${STATUS_TAG[r.status]}`}>{r.status}</span>
                                    {!r.detailsComplete && <span className="text-ink-faint text-xs block mt-1">Application incomplete</span>}
                                </td>
                                <td>
                                    <DecisionButtons applicationId={r.id} status={r.status} offerExpiresAt={r.offerExpiresAt} />
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
