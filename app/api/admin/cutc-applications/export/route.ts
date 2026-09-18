import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgProfile, CutcApplication, CutcCycle, CutcProfile } from "@/lib/supabase/types";

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
    "Resume Link",
    "Status",
    "Submitted At",
    "Cycle",
] as const;

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: cycle } = await admin
        .from("cutc_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CutcCycle, { merge: false }>();

    if (!cycle) {
        return NextResponse.json({ error: "No CUTC cycle exists yet." }, { status: 404 });
    }

    const { data: applications } = await admin
        .from("cutc_applications")
        .select("*")
        .eq("cycle_id", cycle.id)
        .order("submitted_at", { ascending: false })
        .overrideTypes<CutcApplication[], { merge: false }>();

    const apps = applications ?? [];
    const cqgIds = [...new Set(apps.filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
    const cutcIds = [...new Set(apps.filter((a) => a.cutc_profile_id).map((a) => a.cutc_profile_id as string))];

    const { data: cqgProfiles } = cqgIds.length
        ? await admin.from("cqg_profiles").select("*").in("id", cqgIds).overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };
    const { data: cutcProfiles } = cutcIds.length
        ? await admin.from("cutc_profiles").select("*").in("id", cutcIds).overrideTypes<CutcProfile[], { merge: false }>()
        : { data: [] as CutcProfile[] };

    const cqgMap = new Map((cqgProfiles ?? []).map((p) => [p.id, p]));
    const cutcMap = new Map((cutcProfiles ?? []).map((p) => [p.id, p]));

    const rows: unknown[][] = [];

    for (const app of apps) {
        const cqg = app.cqg_profile_id ? cqgMap.get(app.cqg_profile_id) : undefined;
        const cutc = app.cutc_profile_id ? cutcMap.get(app.cutc_profile_id) : undefined;
        const applicant = cqg ?? cutc;

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
            resumeLink,
            app.status,
            app.submitted_at,
            cycle.label,
        ]);
    }

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `cutc-applications-${slugify(cycle.label)}.csv`);
}
