import { NextResponse } from "next/server";
import { fetchAllPages, signedUrlMap } from "@/lib/supabase/helpers";
import { MEMBERSHIP_APPLICATION_SELECT, type MembershipApplicationRow } from "@/lib/supabase/rows";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgMembershipCycle } from "@/lib/supabase/types";

const RESUME_LINK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const COLUMNS = [
    "Name",
    "Email",
    "School",
    "Graduate Program",
    "Expected Graduation",
    "Major",
    "Gender",
    "Current Tier",
    "Resume Link",
    "Accomplishment 1",
    "Accomplishment 2",
    "Accomplishment 3",
    "Accomplishment 4",
    "Accomplishment 5",
    "Status",
    "Submitted At",
    "Cycle",
] as const;

export const maxDuration = 60;

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: cycle } = await admin
        .from("cqg_membership_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<CqgMembershipCycle, { merge: false }>();

    if (!cycle) {
        return NextResponse.json({ error: "No membership cycle exists yet." }, { status: 404 });
    }

    // The API returns at most 1,000 rows per request, so read it in pages.
    const apps = await fetchAllPages<MembershipApplicationRow>((from, to) =>
        admin
            .from("cqg_membership_applications")
            .select(MEMBERSHIP_APPLICATION_SELECT)
            .eq("cycle_id", cycle.id)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<MembershipApplicationRow[], { merge: false }>()
    );

    // One batched request per 100 resumes instead of one request per row.
    const resumeUrlByPath = await signedUrlMap(
        admin,
        "resumes",
        apps.map((a) => a.profile?.resume_path).filter((x): x is string => Boolean(x)),
        RESUME_LINK_TTL_SECONDS
    );

    const rows: unknown[][] = [];

    for (const app of apps) {
        const p = app.profile;
        const resumeLink = (p?.resume_path && resumeUrlByPath.get(p.resume_path)) || "";

        const accomplishments = [0, 1, 2, 3, 4].map((i) => app.accomplishments[i] ?? "");

        rows.push([
            p?.name ?? "",
            p?.email ?? "",
            p?.school ?? "",
            p?.grad_program ?? "",
            p?.year ?? "",
            p?.major ?? "",
            p?.gender ?? "",
            p?.tier ?? "",
            resumeLink,
            ...accomplishments,
            app.status,
            app.submitted_at,
            cycle.label,
        ]);
    }

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `membership-applications-${slugify(cycle.label)}.csv`);
}
