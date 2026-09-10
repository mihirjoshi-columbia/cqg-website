-- Nullable, no default: 20 real accounts already exist without a gender on
-- file. Going forward the signup/profile forms require it (see
-- app/portal/signup/SignupForm.tsx, app/portal/dashboard/ProfileForm.tsx);
-- existing accounts pick one the next time they save profile changes.
alter table cqg_profiles add column gender text;
