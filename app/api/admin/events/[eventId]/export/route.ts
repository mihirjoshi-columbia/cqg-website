import { NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/supabase/helpers";
import { EVENT_APPLICATION_SELECT, type EventApplicationRow } from "@/lib/supabase/rows";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgEvent } from "@/lib/supabase/types";

const COLUMNS = [
    "Name",
    "Email",
    "School",
    "Status",
    "Attended",
    "Applied At",
    "Decided At",
] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const { admin } = await requireAdmin();

    const { data: event } = await admin
        .from("cqg_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle()
        .overrideTypes<CqgEvent, { merge: false }>();

    if (!event) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // The API returns at most 1,000 rows per request, so read it in pages.
    const apps = await fetchAllPages<EventApplicationRow>((from, to) =>
        admin
            .from("cqg_event_applications")
            .select(EVENT_APPLICATION_SELECT)
            .eq("event_id", eventId)
            .order("applied_at", { ascending: true })
            .order("id")
            .range(from, to)
            .overrideTypes<EventApplicationRow[], { merge: false }>()
    );

    const rows: unknown[][] = apps.map((app) => {
        const p = app.profile;
        return [
            p?.name ?? "",
            p?.email ?? "",
            p ? `${p.school ?? ""}${p.grad_program ? ` (${p.grad_program})` : ""}` : "",
            app.status,
            app.attended ? "Yes" : "No",
            app.applied_at,
            app.decided_at ?? "",
        ];
    });

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `event-roster-${slugify(event.title)}.csv`);
}
