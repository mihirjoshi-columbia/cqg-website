import { NextResponse } from "next/server";
import { CTT_APPLICATION_SELECT, travelLodgingLabel, type CttApplicationRow } from "@/lib/ctt-application";
import { fetchAllPages, signedUrlMap } from "@/lib/supabase/helpers";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CttCycle } from "@/lib/supabase/types";

const RESUME_LINK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const COLUMNS = [
    "Name",
    "Email",
    "Applicant Type",
    "College",
    "Major",
    "Expected Graduation",
    "Country",
    "Gender",
    "Prior Internship?",
    "Internship Lined Up?",
    "Internship Location",
    "Needs Travel?",
    "Needs Lodging?",
    "Resume Link",
    "Status",
    "Submitted At",
    "Cycle",
] as const;

// 1,000+ applications: give the export room to finish.
export const maxDuration = 60;

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: cycle } = await admin
        .from("ctt_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CttCycle, { merge: false }>();

    if (!cycle) {
        return NextResponse.json({ error: "No CTT cycle exists yet." }, { status: 404 });
    }

    // The API returns at most 1,000 rows per request, so read it in pages.
    const apps = await fetchAllPages<CttApplicationRow>((from, to) =>
        admin
            .from("ctt_applications")
            .select(CTT_APPLICATION_SELECT)
            .eq("cycle_id", cycle.id)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CttApplicationRow[], { merge: false }>()
    );

    // One batched request per 100 resumes instead of one request per row.
    const resumeUrlByPath = await signedUrlMap(
        admin,
        "resumes",
        apps.map((a) => (a.cqg ?? a.ctt)?.resume_path).filter((x): x is string => Boolean(x)),
        RESUME_LINK_TTL_SECONDS
    );

    const rows: unknown[][] = [];

    for (const app of apps) {
        const applicant = app.cqg ?? app.ctt;

        const resumeLink = (applicant?.resume_path && resumeUrlByPath.get(applicant.resume_path)) || "";

        rows.push([
            applicant?.name ?? "",
            applicant?.email ?? "",
            app.applicant_type === "cqg_member" ? "CQG member" : "External",
            app.college,
            app.major,
            app.grad_year,
            app.country,
            app.gender,
            app.prior_internship ? "Yes" : "No",
            app.internship_lined_up ? "Yes" : "No",
            app.internship_location ?? "",
            travelLodgingLabel(app, "travel_needed"),
            travelLodgingLabel(app, "lodging_needed"),
            resumeLink,
            app.status,
            app.submitted_at,
            cycle.label,
        ]);
    }

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `ctt-applications-${slugify(cycle.label)}.csv`);
}
