import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertRows, updateRow } from "@/lib/supabase/helpers";
import { sendBlastEmail } from "@/lib/email";
import type { EmailBlast, EmailBlastRecipient, BlastSegmentType, ProfileKind } from "@/lib/supabase/types";

interface Recipient {
    profileKind: ProfileKind;
    profileId: string;
    email: string;
    name: string;
}

// How many recipients to actually send per dispatch call. Keeps a single
// invocation fast and lets a large blast resume across multiple cron ticks
// instead of trying to blast everyone in one shot (see the volume note in
// the migration/plan — Resend's free tier can't do 970+ sends at once).
const BATCH_SIZE = 50;

export async function resolveSegment(
    admin: ReturnType<typeof createServiceRoleClient>,
    segmentType: BlastSegmentType,
    params: Record<string, unknown>
): Promise<Recipient[]> {
    if (segmentType === "cqg_tier") {
        const tier = params.tier as string | undefined;
        let query = admin.from("cqg_profiles").select("id,email,name,tier");
        if (tier && tier !== "all") query = query.eq("tier", tier);
        const { data } = await query.overrideTypes<{ id: string; email: string; name: string }[], { merge: false }>();
        return (data ?? []).map((p) => ({ profileKind: "cqg" as const, profileId: p.id, email: p.email, name: p.name }));
    }

    if (segmentType === "cutc_group") {
        const status = params.status as string | undefined;

        if (!status || status === "all") {
            const { data } = await admin
                .from("cutc_profiles")
                .select("id,email,name")
                .overrideTypes<{ id: string; email: string; name: string }[], { merge: false }>();
            return (data ?? []).map((p) => ({ profileKind: "cutc" as const, profileId: p.id, email: p.email, name: p.name }));
        }

        const { data: apps } = await admin
            .from("cutc_applications")
            .select("applicant_type,cqg_profile_id,cutc_profile_id")
            .eq("status", status)
            .overrideTypes<{ applicant_type: string; cqg_profile_id: string | null; cutc_profile_id: string | null }[], { merge: false }>();

        const cqgIds = [...new Set((apps ?? []).filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
        const cutcIds = [...new Set((apps ?? []).filter((a) => a.cutc_profile_id).map((a) => a.cutc_profile_id as string))];

        const [{ data: cqgProfiles }, { data: cutcProfiles }] = await Promise.all([
            cqgIds.length
                ? admin.from("cqg_profiles").select("id,email,name").in("id", cqgIds).overrideTypes<{ id: string; email: string; name: string }[], { merge: false }>()
                : Promise.resolve({ data: [] as { id: string; email: string; name: string }[] }),
            cutcIds.length
                ? admin.from("cutc_profiles").select("id,email,name").in("id", cutcIds).overrideTypes<{ id: string; email: string; name: string }[], { merge: false }>()
                : Promise.resolve({ data: [] as { id: string; email: string; name: string }[] }),
        ]);

        return [
            ...(cqgProfiles ?? []).map((p) => ({ profileKind: "cqg" as const, profileId: p.id, email: p.email, name: p.name })),
            ...(cutcProfiles ?? []).map((p) => ({ profileKind: "cutc" as const, profileId: p.id, email: p.email, name: p.name })),
        ];
    }

    if (segmentType === "event_group") {
        const eventId = params.eventId as string;
        const which = params.which as string; // "applied" | "attended"

        const { data: apps } = await admin
            .from("cqg_event_applications")
            .select("profile_id,status,attended")
            .eq("event_id", eventId)
            .overrideTypes<{ profile_id: string; status: string; attended: boolean }[], { merge: false }>();

        const filtered =
            which === "attended"
                ? (apps ?? []).filter((a) => a.attended)
                : (apps ?? []).filter((a) => a.status !== "withdrawn");

        const profileIds = [...new Set(filtered.map((a) => a.profile_id))];
        if (!profileIds.length) return [];

        const { data: profiles } = await admin
            .from("cqg_profiles")
            .select("id,email,name")
            .in("id", profileIds)
            .overrideTypes<{ id: string; email: string; name: string }[], { merge: false }>();
        return (profiles ?? []).map((p) => ({ profileKind: "cqg" as const, profileId: p.id, email: p.email, name: p.name }));
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
