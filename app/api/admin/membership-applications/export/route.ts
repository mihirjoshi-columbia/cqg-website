import { NextResponse } from "next/server";
import { fetchAllPages, fetchByIds } from "@/lib/supabase/helpers";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgMembershipApplication, CqgMembershipCycle, CqgProfile } from "@/lib/supabase/types";

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

    const apps = await fetchAllPages<CqgMembershipApplication>((from, to) =>
        admin
            .from("cqg_membership_applications")
            .select("*")
            .eq("cycle_id", cycle.id)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CqgMembershipApplication[], { merge: false }>()
    );
    const profileIds = [...new Set(apps.map((a) => a.profile_id))];

    const profiles = await fetchByIds<CqgProfile>(profileIds, (chunk) =>
        admin.from("cqg_profiles").select("*").in("id", chunk).overrideTypes<CqgProfile[], { merge: false }>()
    );
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const rows: unknown[][] = [];

    for (const app of apps) {
        const p = profileMap.get(app.profile_id);

        let resumeLink = "";
        if (p?.resume_path) {
            const { data: signed } = await admin.storage
                .from("resumes")
                .createSignedUrl(p.resume_path, RESUME_LINK_TTL_SECONDS);
            resumeLink = signed?.signedUrl ?? "";
        }

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
