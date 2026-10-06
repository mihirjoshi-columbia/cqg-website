import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAllPages, insertRows, updateRow } from "@/lib/supabase/helpers";
import { sendBlastEmail } from "@/lib/email";
import type { EmailBlast, EmailBlastRecipient, BlastSegmentType, ProfileKind } from "@/lib/supabase/types";

interface Recipient {
    profileKind: ProfileKind;
    profileId: string;
    email: string;
    name: string;
}

// How many recipients to actually send per dispatch call. On the $20/mo
// Resend plan there's no daily cap and the account's hard limit is 10
// req/sec, so this isn't a volume ceiling -- it's pacing. 200 per 5-minute
// cron tick is ~0.67/sec sustained, well under the API limit, but still
// avoids the burst-send pattern that got CQG's domain reputation flagged
// before (see the DMARC/burst-pattern investigation).
const BATCH_SIZE = 200;

type NamedRow = { id: string; email: string; name: string };

// Every query below can match more than 1,000 rows (the API's silent per-request
// cap), so they read in pages. Missing recipients here means people silently
// never get the blast. Applicants come attached to their application row by the
// database (one query), so there's nothing to look up afterwards.
export async function resolveSegment(
    admin: ReturnType<typeof createServiceRoleClient>,
    segmentType: BlastSegmentType,
    params: Record<string, unknown>
): Promise<Recipient[]> {
    const cqgRecipient = (p: NamedRow): Recipient => ({ profileKind: "cqg", profileId: p.id, email: p.email, name: p.name });
    const cttRecipient = (p: NamedRow): Recipient => ({ profileKind: "ctt", profileId: p.id, email: p.email, name: p.name });

    if (segmentType === "cqg_tier") {
        const tier = params.tier as string | undefined;
        const profiles = await fetchAllPages<NamedRow>((from, to) => {
            let query = admin.from("cqg_profiles").select("id,email,name,tier");
            if (tier && tier !== "all") query = query.eq("tier", tier);
            return query.order("id").range(from, to).overrideTypes<NamedRow[], { merge: false }>();
        });
        return profiles.map(cqgRecipient);
    }

    if (segmentType === "ctt_group") {
        const status = params.status as string | undefined;

        if (!status || status === "all") {
            const profiles = await fetchAllPages<NamedRow>((from, to) =>
                admin.from("ctt_profiles").select("id,email,name").order("id").range(from, to).overrideTypes<NamedRow[], { merge: false }>()
            );
            return profiles.map(cttRecipient);
        }

        // An applicant can have applied in more than one cycle, so de-duplicate by profile.
        type AppRow = { cqg: NamedRow | null; ctt: NamedRow | null };
        const apps = await fetchAllPages<AppRow>((from, to) =>
            admin
                .from("ctt_applications")
                .select("cqg:cqg_profiles!cqg_profile_id(id,email,name), ctt:ctt_profiles(id,email,name)")
                .eq("status", status)
                .order("id")
                .range(from, to)
                .overrideTypes<AppRow[], { merge: false }>()
        );
        const cqg = new Map(apps.flatMap((a) => (a.cqg ? [[a.cqg.id, a.cqg] as const] : [])));
        const ctt = new Map(apps.flatMap((a) => (a.ctt ? [[a.ctt.id, a.ctt] as const] : [])));
        return [...[...cqg.values()].map(cqgRecipient), ...[...ctt.values()].map(cttRecipient)];
    }

    if (segmentType === "event_group") {
        const eventId = params.eventId as string;
        const which = params.which as string; // "applied" | "attended"

        type EventAppRow = { status: string; attended: boolean; profile: NamedRow | null };
        const apps = await fetchAllPages<EventAppRow>((from, to) =>
            admin
                .from("cqg_event_applications")
                .select("status,attended,profile:cqg_profiles!profile_id(id,email,name)")
                .eq("event_id", eventId)
                .order("id")
                .range(from, to)
                .overrideTypes<EventAppRow[], { merge: false }>()
        );

        const filtered = which === "attended" ? apps.filter((a) => a.attended) : apps.filter((a) => a.status !== "withdrawn");
        return filtered.flatMap((a) => (a.profile ? [cqgRecipient(a.profile)] : []));
    }

    return [];
}

function renderTemplate(template: string, name: string): string {
    return template.replace(/\{\{\s*name\s*\}\}/gi, name);
}

// Processes one due blast: on first touch, resolves its segment live and
// materializes the recipient list (status='pending' rows); every call after
// that just sends the next batch of still-pending recipients.
async function dispatchOne(admin: ReturnType<typeof createServiceRoleClient>, blast: EmailBlast) {
    if (blast.status === "scheduled") {
        const recipients = await resolveSegment(admin, blast.segment_type, blast.segment_params);
        if (recipients.length) {
            const rows = recipients.map((r) => ({
                blast_id: blast.id,
                profile_kind: r.profileKind,
                profile_id: r.profileId,
                email: r.email,
                name: r.name,
            }));
            for (let i = 0; i < rows.length; i += 500) {
                const { error } = await insertRows(admin, "email_blast_recipients", rows.slice(i, i + 500));
                if (error) {
                    console.error("[blasts] recipient materialization failed:", error);
                    await updateRow(admin, "email_blasts", blast.id, { status: "failed" });
                    return;
                }
            }
        }
        await updateRow(admin, "email_blasts", blast.id, { status: "sending" });
    }

    const { data: pending } = await admin
        .from("email_blast_recipients")
        .select("*")
        .eq("blast_id", blast.id)
        .eq("status", "pending")
        .limit(BATCH_SIZE)
        .overrideTypes<EmailBlastRecipient[], { merge: false }>();

    for (const recipient of pending ?? []) {
        try {
            await sendBlastEmail(recipient.email, blast.subject, renderTemplate(blast.body_html, recipient.name));
            await updateRow(admin, "email_blast_recipients", recipient.id, {
                status: "sent",
                sent_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error("[blasts] send failed for", recipient.email, err);
            await updateRow(admin, "email_blast_recipients", recipient.id, {
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    const { count } = await admin
        .from("email_blast_recipients")
        .select("id", { count: "exact", head: true })
        .eq("blast_id", blast.id)
        .eq("status", "pending");

    if (!count) {
        await updateRow(admin, "email_blasts", blast.id, {
            status: "sent",
            sent_at: new Date().toISOString(),
        });
    }
}

export async function dispatchDueBlasts() {
    const admin = createServiceRoleClient();
    const now = new Date().toISOString();

    const { data: due } = await admin
        .from("email_blasts")
        .select("*")
        .in("status", ["scheduled", "sending"])
        .lte("scheduled_at", now)
        .overrideTypes<EmailBlast[], { merge: false }>();

    for (const blast of due ?? []) {
        await dispatchOne(admin, blast);
    }

    return { processed: due?.length ?? 0 };
}
