import { createServiceRoleClient } from "@/lib/supabase/server";
import { updateRow } from "@/lib/supabase/helpers";
import { sendResumeReminderEmail } from "@/lib/email";
import type { CqgProfile, CutcProfile } from "@/lib/supabase/types";

// Resume upload is expected to finish account setup, and this sweep sends a
// single reminder to accounts that verified their email but never uploaded
// one. It does NOT delete accounts.
//
// It used to: 24h with no resume got a reminder, and 24h after that the auth
// user was deleted outright. That ran hourly from 2026-09-10 and wiped out
// every account that pre-dated the resume requirement -- resume upload was
// optional when those users signed up, so on the first run they all looked
// like "verified long ago, still no resume" and were gone within a day. An
// automated irreversible delete is the wrong tool for an incomplete profile:
// /portal/complete-profile already blocks the dashboard until a resume is
// uploaded, which is enough enforcement. Removing an account is now a manual
// admin decision.
//
// Two guards keep a re-enabled sweep from spamming people it shouldn't:
// accounts verified before the policy shipped are grandfathered out entirely,
// and resume_reminder_sent_at means an account is never nudged twice.
const REMINDER_AFTER_HOURS = 24;

// Accounts that verified their email before the resume requirement existed
// never agreed to it and are out of scope. Only accounts created under the
// current rules get reminded.
const RESUME_POLICY_START = Date.parse("2026-09-10T00:00:00Z");

function hoursSince(iso: string): number {
    return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

const KINDS = [
    { kind: "cqg", table: "cqg_profiles", uploadPath: "/portal/complete-profile" },
    { kind: "cutc", table: "cutc_profiles", uploadPath: "/cutc/apply/complete-profile" },
] as const;

export async function sweepResumeReminders() {
    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    let reminded = 0;
    let skippedGrandfathered = 0;

    for (const { kind, table, uploadPath } of KINDS) {
        const { data: profiles } = await admin
            .from(table)
            .select("*")
            .is("resume_path", null)
            .is("resume_reminder_sent_at", null)
            .overrideTypes<(CqgProfile | CutcProfile)[], { merge: false }>();

        for (const profile of profiles ?? []) {
            const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
            const confirmedAt = authUser?.user?.email_confirmed_at;
            if (!confirmedAt) continue; // never verified -- not in scope for this sweep

            if (Date.parse(confirmedAt) < RESUME_POLICY_START) {
                skippedGrandfathered++;
                continue;
            }
            if (hoursSince(confirmedAt) < REMINDER_AFTER_HOURS) continue;

            try {
                await sendResumeReminderEmail(profile.email, profile.name, `${siteUrl}${uploadPath}`);
                await updateRow(admin, table, profile.id, {
                    resume_reminder_sent_at: new Date().toISOString(),
                });
                reminded++;
            } catch (err) {
                console.error(`[resume-reminders] reminder send failed for ${profile.email} (${kind}):`, err);
            }
        }
    }

    return { reminded, skippedGrandfathered };
}
