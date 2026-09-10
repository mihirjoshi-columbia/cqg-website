import { createServiceRoleClient } from "@/lib/supabase/server";
import { updateRow } from "@/lib/supabase/helpers";
import { sendResumeReminderEmail, sendAccountDeletedEmail } from "@/lib/email";
import type { CqgProfile, CutcProfile } from "@/lib/supabase/types";

// Resume upload is required to finish account setup. The clock starts at
// email verification (Supabase Auth's email_confirmed_at, the authoritative
// source — not something this app mirrors separately): 24h with no resume
// gets a reminder email; 24h after that reminder with still no resume, the
// account is deleted. Deletion is measured from when the reminder was
// actually sent (resume_reminder_sent_at), not a fixed 48h from
// verification, so a delayed cron run doesn't compound drift onto both
// thresholds.
const REMINDER_AFTER_HOURS = 24;
const DELETE_AFTER_REMINDER_HOURS = 24;

function hoursSince(iso: string): number {
    return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

const KINDS = [
    { kind: "cqg", table: "cqg_profiles", uploadPath: "/portal/complete-profile", signupPath: "/portal/signup" },
    { kind: "cutc", table: "cutc_profiles", uploadPath: "/cutc/apply/complete-profile", signupPath: "/cutc/apply/signup" },
] as const;

export async function sweepResumeReminders() {
    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    let reminded = 0;
    let deleted = 0;

    for (const { kind, table, uploadPath, signupPath } of KINDS) {
        const { data: profiles } = await admin
            .from(table)
            .select("*")
            .is("resume_path", null)
            .overrideTypes<(CqgProfile | CutcProfile)[], { merge: false }>();

        for (const profile of profiles ?? []) {
            const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
            const confirmedAt = authUser?.user?.email_confirmed_at;
            if (!confirmedAt) continue; // never verified -- not in scope for this sweep

            if (!profile.resume_reminder_sent_at) {
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
                continue;
            }

            if (hoursSince(profile.resume_reminder_sent_at) < DELETE_AFTER_REMINDER_HOURS) continue;

            const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id);
            if (deleteError) {
                console.error(`[resume-reminders] delete failed for ${profile.email} (${kind}):`, deleteError);
                continue;
            }
            deleted++;
            try {
                await sendAccountDeletedEmail(profile.email, profile.name, `${siteUrl}${signupPath}`);
            } catch (err) {
                console.error(`[resume-reminders] deletion-notice send failed for ${profile.email} (${kind}):`, err);
            }
        }
    }

    return { reminded, deleted };
}
