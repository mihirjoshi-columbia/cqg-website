import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse } from "@/lib/csv";
import type { CqgMembershipCycle } from "@/lib/supabase/types";

const COLUMNS = ["Label", "Opens At", "Closes At"] as const;

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: cycles } = await admin
        .from("cqg_membership_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .overrideTypes<CqgMembershipCycle[], { merge: false }>();

    const rows: unknown[][] = (cycles ?? []).map((c) => [c.label, c.opens_at, c.closes_at]);

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, "internal-membership-cycles.csv");
}
