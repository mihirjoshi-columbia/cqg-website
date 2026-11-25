import { requireAdmin } from "@/lib/admin";
import { fetchAllPages, signedUrlMap } from "@/lib/supabase/helpers";
import { buildCsv, csvResponse } from "@/lib/csv";
import type { CqgProfile } from "@/lib/supabase/types";

const RESUME_LINK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const COLUMNS = [
    "Name",
    "Email",
    "School",
    "Graduate Program",
    "Expected Graduation",
    "Major",
    "Gender",
    "Tier",
    "Resume Link",
    "Created At",
] as const;

export const maxDuration = 60;

// `onlyIds` limits the export to those accounts (the rows left after the admin's filters);
// null exports everyone.
async function exportMembers(onlyIds: string[] | null) {
    const { admin } = await requireAdmin();

    const all = await fetchAllPages<CqgProfile>((from, to) =>
        admin
            .from("cqg_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CqgProfile[], { merge: false }>()
    );
    const wanted = onlyIds ? new Set(onlyIds) : null;
    const members = wanted ? all.filter((m) => wanted.has(m.id)) : all;

    const resumeUrlByPath = await signedUrlMap(
        admin,
        "resumes",
        members.map((m) => m.resume_path).filter((x): x is string => Boolean(x)),
        RESUME_LINK_TTL_SECONDS
    );

    const rows: unknown[][] = [];

    for (const m of members) {
        const resumeLink = (m.resume_path && resumeUrlByPath.get(m.resume_path)) || "";

        rows.push([
            m.name,
            m.email,
            m.school,
            m.grad_program ?? "",
            m.year,
            m.major,
            m.gender ?? "",
            m.tier,
            resumeLink,
            m.created_at,
        ]);
    }

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, wanted ? "cqg-members-filtered.csv" : "cqg-members.csv");
}

export async function GET() {
    return exportMembers(null);
}

// The members table posts the ids of the rows it is showing, so the CSV matches the filters.
export async function POST(request: Request) {
    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string") : null;
    return exportMembers(ids);
}
