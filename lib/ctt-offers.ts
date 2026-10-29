import { createServiceRoleClient } from "@/lib/supabase/server";
import { updateRow } from "@/lib/supabase/helpers";
import { sendCttOfferEmail } from "@/lib/email";
import type { CttApplication, CttApplicationStatus } from "@/lib/supabase/types";

// How long an applicant has to answer an offer.
export const OFFER_HOURS = 24;

// Statuses an offer can be (re)made from.
const OFFERABLE: CttApplicationStatus[] = ["pending", "expired", "declined"];

// "Friday, October 30 at 4:15 PM ET"
export function formatOfferDeadline(iso: string): string {
    const d = new Date(iso);
    const tz = "America/New_York";
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d);
    return `${day} at ${time} ET`;
}

// Where an applicant answers: Columbia/Barnard accounts use the CQG portal, everyone else the CTT dashboard.
export function dashboardUrlFor(applicantType: CttApplication["applicant_type"]): string {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.columbiaquantgroup.com";
    return `${site}${applicantType === "cqg_member" ? "/portal/dashboard" : "/ctt/apply/dashboard"}`;
}

type AdminClient = ReturnType<typeof createServiceRoleClient>;

// Makes an offer: starts the 24-hour clock and emails the applicant. The row is updated first (so a
// double click can't send two emails), and put back the way it was if the email fails, so nobody
// is left with a running clock and no email.
export async function offerSpot(admin: AdminClient, applicationId: string): Promise<{ ok: boolean; error?: string }> {
    const { data: app } = await admin
        .from("ctt_applications")
        .select("*, cqg:cqg_profiles!cqg_profile_id(name,email), ctt:ctt_profiles(name,email)")
        .eq("id", applicationId)
        .maybeSingle()
        .overrideTypes<
            CttApplication & { cqg: { name: string; email: string } | null; ctt: { name: string; email: string } | null },
            { merge: false }
        >();

    if (!app) return { ok: false, error: "Application not found." };
    if (!OFFERABLE.includes(app.status)) return { ok: false, error: `Can't offer a spot from status "${app.status}".` };
    const applicant = app.cqg ?? app.ctt;
    if (!applicant) return { ok: false, error: "Applicant has no profile." };

    // An application we made for them: tell apart someone whose account we created (never logged in)
    // from someone who made their own account but never submitted.
    let incomplete: "created" | "unfinished" | undefined;
    if (!app.details_complete && app.ctt_profile_id) {
        const { data: user } = await admin.auth.admin.getUserById(app.ctt_profile_id);
        incomplete = user?.user?.last_sign_in_at ? "unfinished" : "created";
    }

    const offeredAt = new Date();
    const expiresAt = new Date(offeredAt.getTime() + OFFER_HOURS * 3_600_000);

    const previous = { status: app.status, offered_at: app.offered_at, offer_expires_at: app.offer_expires_at, responded_at: app.responded_at };
    const { error: updateError } = await updateRow(admin, "ctt_applications", applicationId, {
        status: "offered",
        offered_at: offeredAt.toISOString(),
        offer_expires_at: expiresAt.toISOString(),
        responded_at: null,
    });
    if (updateError) return { ok: false, error: "Couldn't save the offer." };

    try {
        await sendCttOfferEmail(
            applicant.email,
            applicant.name,
            formatOfferDeadline(expiresAt.toISOString()),
            dashboardUrlFor(app.applicant_type),
            { incomplete }
        );
    } catch (err) {
        console.error(`[ctt-offers] offer email failed for ${applicant.email}:`, err);
        await updateRow(admin, "ctt_applications", applicationId, previous);
        return { ok: false, error: "The email failed to send, so the offer was undone." };
    }
    return { ok: true };
}

// Flips offers whose 24 hours are up to "expired". The applicant-facing pages already treat an
// overdue offer as expired, and respond_ctt_offer refuses a late answer, so this only keeps the
// stored status honest for the admin list. Run from the 5-minute scheduled job.
export async function expireOverdueOffers(admin: AdminClient): Promise<number> {
    const { data, error } = await admin
        .from("ctt_applications")
        .update({ status: "expired" } as never)
        .eq("status", "offered")
        .lte("offer_expires_at", new Date().toISOString())
        .select("id");
    if (error) {
        console.error("[ctt-offers] expiring overdue offers failed:", error);
        return 0;
    }
    return data?.length ?? 0;
}
