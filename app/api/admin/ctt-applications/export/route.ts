import { NextResponse } from "next/server";
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
    "Needs Travel & Housing?",
    "Resume Link",
    "Status",
    "Submitted At",
    "Cycle",
] as const;

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

    const { data: applications } = await admin
        .from("ctt_applications")
        .select("*")
        .eq("cycle_id", cycle.id)
        .order("submitted_at", { ascending: false })
        .overrideTypes<CttApplication[], { merge: false }>();

    const apps = applications ?? [];
    const cqgIds = [...new Set(apps.filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
    const cttIds = [...new Set(apps.filter((a) => a.ctt_profile_id).map((a) => a.ctt_profile_id as string))];

    const { data: cqgProfiles } = cqgIds.length
        ? await admin.from("cqg_profiles").select("*").in("id", cqgIds).overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };
    const { data: cttProfiles } = cttIds.length
        ? await admin.from("ctt_profiles").select("*").in("id", cttIds).overrideTypes<CttProfile[], { merge: false }>()
        : { data: [] as CttProfile[] };

    const cqgMap = new Map((cqgProfiles ?? []).map((p) => [p.id, p]));
    const cttMap = new Map((cttProfiles ?? []).map((p) => [p.id, p]));

    const rows: unknown[][] = [];

    for (const app of apps) {
        const cqg = app.cqg_profile_id ? cqgMap.get(app.cqg_profile_id) : undefined;
        const ctt = app.ctt_profile_id ? cttMap.get(app.ctt_profile_id) : undefined;
        const applicant = cqg ?? ctt;

        let resumeLink = "";
        if (applicant?.resume_path) {
            const { data: signed } = await admin.storage
                .from("resumes")
                .createSignedUrl(applicant.resume_path, RESUME_LINK_TTL_SECONDS);
            resumeLink = signed?.signedUrl ?? "";
        }

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
            app.travel_housing_needed ? "Yes" : "No",
            resumeLink,
            app.status,
            app.submitted_at,
            cycle.label,
        ]);
    }

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `ctt-applications-${slugify(cycle.label)}.csv`);
}
