import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildCsv, csvResponse, slugify } from "@/lib/csv";
import type { CqgEvent, CqgEventApplication, CqgProfile } from "@/lib/supabase/types";

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

    const { data: applications } = await admin
        .from("cqg_event_applications")
        .select("*")
        .eq("event_id", eventId)
        .order("applied_at", { ascending: true })
        .overrideTypes<CqgEventApplication[], { merge: false }>();

    const apps = applications ?? [];
    const profileIds = [...new Set(apps.map((a) => a.profile_id))];

    const { data: profiles } = profileIds.length
        ? await admin.from("cqg_profiles").select("*").in("id", profileIds).overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const rows: unknown[][] = apps.map((app) => {
        const p = profileMap.get(app.profile_id);
        return [
            p?.name ?? "",
            p?.email ?? "",
            p ? `${p.school}${p.grad_program ? ` (${p.grad_program})` : ""}` : "",
            app.status,
            app.attended ? "Yes" : "No",
            app.applied_at,
            app.decided_at ?? "",
        ];
    });

    const csv = buildCsv(COLUMNS, rows);
    return csvResponse(csv, `event-roster-${slugify(event.title)}.csv`);
}
