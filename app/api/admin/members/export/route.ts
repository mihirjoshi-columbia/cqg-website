import { requireAdmin } from "@/lib/admin";
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

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: members } = await admin
        .from("cqg_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .overrideTypes<CqgProfile[], { merge: false }>();

    const rows: unknown[][] = [];

    for (const m of members ?? []) {
        let resumeLink = "";
        if (m.resume_path) {
            const { data: signed } = await admin.storage
                .from("resumes")
                .createSignedUrl(m.resume_path, RESUME_LINK_TTL_SECONDS);
            resumeLink = signed?.signedUrl ?? "";
        }

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
