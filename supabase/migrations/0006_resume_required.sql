-- Tracks whether the "upload your resume within 24h or lose the reminder
-- window" email has already gone out for an account, so the sweep job in
-- lib/resume-reminders.ts doesn't resend it every run. Deletion follows 24h
-- after this timestamp, not a fixed offset from verification, so a delayed
-- cron run doesn't compound drift onto both thresholds.
alter table cqg_profiles add column resume_reminder_sent_at timestamptz;
alter table cutc_profiles add column resume_reminder_sent_at timestamptz;
