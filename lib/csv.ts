import { NextResponse } from "next/server";

// Excel/Sheets-safe CSV cell: wrap in quotes whenever the value contains a
// comma, quote, or newline, doubling any embedded quotes.
function csvCell(value: string): string {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function buildCsv(columns: readonly string[], rows: readonly unknown[][]): string {
    const lines = [columns.map((c) => csvCell(c)).join(",")];
    for (const row of rows) {
        lines.push(row.map((c) => csvCell(String(c ?? ""))).join(","));
    }
    return lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string): NextResponse {
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

// Matches the slugging already used for the membership-applications export
// filename, generalized for reuse.
export function slugify(label: string): string {
    return label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}
