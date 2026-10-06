import { NextResponse } from "next/server";
import { travelLodgingLabel } from "@/lib/ctt-application";
import { fetchAllPages, fetchByIds, signedUrlMap } from "@/lib/supabase/helpers";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgProfile, CttApplication, CttCycle, CttProfile } from "@/lib/supabase/types";

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

    const apps = await fetchAllPages<CttApplication>((from, to) =>
        admin
            .from("ctt_applications")
            .select("*")
            .eq("cycle_id", cycle.id)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CttApplication[], { merge: false }>()
    );
    const cqgIds = [...new Set(apps.filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
    const cttIds = [...new Set(apps.filter((a) => a.ctt_profile_id).map((a) => a.ctt_profile_id as string))];

    const cqgProfiles = await fetchByIds<CqgProfile>(cqgIds, (chunk) =>
        admin.from("cqg_profiles").select("*").in("id", chunk).overrideTypes<CqgProfile[], { merge: false }>()
    );
    const cttProfiles = await fetchByIds<CttProfile>(cttIds, (chunk) =>
        admin.from("ctt_profiles").select("*").in("id", chunk).overrideTypes<CttProfile[], { merge: false }>()
    );

    const cqgMap = new Map(cqgProfiles.map((p) => [p.id, p]));
    const cttMap = new Map(cttProfiles.map((p) => [p.id, p]));

    // One batched request per 100 resumes instead of one request per row.
    const resumeUrlByPath = await signedUrlMap(
        admin,
        "resumes",
        [...cqgProfiles, ...cttProfiles].map((p) => p.resume_path).filter((x): x is string => Boolean(x)),
        RESUME_LINK_TTL_SECONDS
    );

    const rows: unknown[][] = [];

    for (const app of apps) {
        const cqg = app.cqg_profile_id ? cqgMap.get(app.cqg_profile_id) : undefined;
        const ctt = app.ctt_profile_id ? cttMap.get(app.ctt_profile_id) : undefined;
        const applicant = cqg ?? ctt;

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
