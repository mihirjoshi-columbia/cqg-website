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

export async function GET() {
    const { admin } = await requireAdmin();

    const members = await fetchAllPages<CqgProfile>((from, to) =>
        admin
            .from("cqg_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CqgProfile[], { merge: false }>()
    );
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
    return csvResponse(csv, "cqg-members.csv");
}
