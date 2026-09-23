-- Bulk-importing Fall 2026 Internal Membership applicants collected via a
-- Google Form (not the app's own signup flow): that form never asked for
-- School, so ~40 new accounts need to be created without one on file.
-- Same pattern as gender in 0007 -- students pick one from the dashboard
-- profile form later.
alter table cqg_profiles alter column school drop not null;

alter table cqg_profiles drop constraint grad_program_matches_school;
alter table cqg_profiles add constraint grad_program_matches_school check (
  (school = 'GRAD' and grad_program is not null) or
  (school is distinct from 'GRAD' and grad_program is null)
);
