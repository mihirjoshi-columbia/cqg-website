import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse } from "@/lib/csv";
import type { EmailBlast } from "@/lib/supabase/types";

const SEGMENT_LABEL: Record<string, string> = {
    cqg_tier: "CQG tier",
    cutc_group: "CTT group",
    event_group: "Event group",
};

const COLUMNS = [
    "Subject",
    "Segment",
    "Segment Params",
    "Scheduled At",
    "Status",
    "Created At",
    "Sent At",
] as const;

export async function GET() {
    const { admin } = await requireAdmin();

    const { data: blasts } = await admin
        .from("email_blasts")
        .select("*")
        .order("created_at", { ascending: false })
        .overrideTypes<EmailBlast[], { merge: false }>();

    const rows: unknown[][] = (blasts ?? []).map((b) => [
        b.subject,
        SEGMENT_LABEL[b.segment_type] ?? b.segment_type,
        JSON.stringify(b.segment_params),
        b.scheduled_at ?? "",
        b.status,
        b.created_at,
        b.sent_at ?? "",
    ]);

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, "email-blasts.csv");
}
