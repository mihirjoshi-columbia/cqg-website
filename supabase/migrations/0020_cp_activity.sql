-- Activity log for the competitive programming set (/portal/cp), read by the
-- live admin board at /portal/admin/cp.
--
-- The judge runs in the member's browser (lib/cp/runner.ts), so a verdict
-- here is what that browser REPORTED, not something the server checked. A
-- member who wants to can fake an "accepted". That is acceptable for a
-- practice board an admin puts on a projector, and is the price of having no
-- server-side judge; do not reuse these rows for anything graded.
--
-- One row per event: 'started' when a member opens the page, and one row per
-- Submit with its verdict. Running the samples is not logged.
create table cqg_cp_activity (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references cqg_profiles(id) on delete cascade,
  kind text not null
    check (kind in ('started', 'accepted', 'wrong', 'runtime', 'timeout', 'compile')),
  -- lib/cp/problems.ts ids. Null only for 'started'.
  problem_id text,
  language text check (language in ('python', 'cpp')),
  -- 1-based test that failed, for wrong / runtime / timeout.
  failed_test integer,
  created_at timestamptz not null default now(),
  constraint cp_activity_submission_has_problem
    check (kind = 'started' or (problem_id is not null and language is not null))
);

create index cqg_cp_activity_created_idx on cqg_cp_activity (created_at);

-- Writes go only through the service-role client in app/api/cp/activity,
-- which re-checks membership with checkInternalMember(). Only admins read.
alter table cqg_cp_activity enable row level security;

create policy cp_activity_select_admin on cqg_cp_activity
  for select using (is_admin());
