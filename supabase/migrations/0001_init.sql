-- CQG portals: full schema for CQG accounts, CUTC accounts, events/attendance,
-- and email blasts. Run this once in the Supabase SQL editor (or via the CLI)
-- on a fresh project. Idempotent-ish via IF NOT EXISTS where practical, but this
-- is meant to run once against an empty database.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- Enums
-- ============================================================================
create type cqg_tier as enum ('general_body', 'member', 'admin');
create type cqg_school as enum ('CC', 'SEAS', 'Barnard', 'GS', 'GRAD');
create type application_status as enum ('pending', 'approved', 'rejected');
create type event_application_status as enum ('pending', 'accepted', 'waitlisted', 'rejected', 'withdrawn');
create type cutc_applicant_type as enum ('cqg_member', 'external');
create type blast_segment_type as enum ('cqg_tier', 'cutc_group', 'event_group');
create type blast_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');
create type blast_recipient_status as enum ('pending', 'sent', 'failed');
create type profile_kind as enum ('cqg', 'cutc');

-- ============================================================================
-- CQG accounts (columbia.edu / barnard.edu only — enforced in the app layer
-- at signup, not here, since Postgres can't see the auth.users email at
-- insert time without a trigger reading auth.users; the signup Server Action
-- is the actual gate).
-- ============================================================================
create table cqg_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  school cqg_school not null,
  grad_program text, -- only set when school = 'GRAD'
  year text not null,
  major text not null,
  resume_path text,
  tier cqg_tier not null default 'general_body',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grad_program_matches_school check (
    (school = 'GRAD' and grad_program is not null) or
    (school != 'GRAD' and grad_program is null)
  )
);

create table cqg_membership_cycles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  created_by uuid references cqg_profiles(id),
  created_at timestamptz not null default now(),
  constraint closes_after_opens check (closes_at > opens_at)
);

create table cqg_membership_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references cqg_profiles(id) on delete cascade,
  cycle_id uuid not null references cqg_membership_cycles(id),
  status application_status not null default 'pending',
  short_answer text, -- placeholder for future extra questions
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references cqg_profiles(id),
  unique (profile_id, cycle_id)
);

-- ============================================================================
-- CUTC accounts (any .edu except columbia.edu / barnard.edu — same note as
-- above, enforced in the signup Server Action)
-- ============================================================================
create table cutc_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  school text not null,
  year text not null,
  resume_path text,
  attestation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cutc_cycles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  created_by uuid references cqg_profiles(id),
  created_at timestamptz not null default now(),
  constraint closes_after_opens check (closes_at > opens_at)
);

create table cutc_applications (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cutc_cycles(id),
  status application_status not null default 'pending',
  applicant_type cutc_applicant_type not null,
  cqg_profile_id uuid references cqg_profiles(id) on delete cascade,
  cutc_profile_id uuid references cutc_profiles(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references cqg_profiles(id),
  constraint exactly_one_applicant check (
    (cqg_profile_id is not null and cutc_profile_id is null) or
    (cqg_profile_id is null and cutc_profile_id is not null)
  ),
  constraint applicant_type_matches check (
    (applicant_type = 'cqg_member' and cqg_profile_id is not null) or
    (applicant_type = 'external' and cutc_profile_id is not null)
  )
);
create unique index cutc_applications_one_per_cycle_cqg
  on cutc_applications (cqg_profile_id, cycle_id) where cqg_profile_id is not null;
create unique index cutc_applications_one_per_cycle_external
  on cutc_applications (cutc_profile_id, cycle_id) where cutc_profile_id is not null;

-- ============================================================================
-- Firm events (portal-only; any CQG accountholder can apply)
-- ============================================================================
create table cqg_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer, -- null = unlimited
  applications_locked boolean not null default false,
  created_by uuid references cqg_profiles(id),
  created_at timestamptz not null default now(),
  constraint capacity_positive check (capacity is null or capacity > 0)
);

create table cqg_event_applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references cqg_events(id) on delete cascade,
  profile_id uuid not null references cqg_profiles(id) on delete cascade,
  status event_application_status not null default 'pending',
  attended boolean not null default false,
  attended_marked_at timestamptz,
  attended_marked_by uuid references cqg_profiles(id),
  applied_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references cqg_profiles(id),
  unique (event_id, profile_id)
);

-- ============================================================================
-- Email blasts (admin-only)
-- ============================================================================
create table email_blasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  segment_type blast_segment_type not null,
  segment_params jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz, -- null = send immediately when dispatched
  status blast_status not null default 'draft',
  created_by uuid references cqg_profiles(id),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table email_blast_recipients (
  id uuid primary key default gen_random_uuid(),
  blast_id uuid not null references email_blasts(id) on delete cascade,
  profile_kind profile_kind not null,
  profile_id uuid not null,
  email text not null,
  name text not null,
  status blast_recipient_status not null default 'pending',
  sent_at timestamptz,
  error text
);
create index email_blast_recipients_blast_idx on email_blast_recipients (blast_id);

-- ============================================================================
-- updated_at helper
-- ============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cqg_profiles_set_updated_at
  before update on cqg_profiles
  for each row execute function set_updated_at();

create trigger cutc_profiles_set_updated_at
  before update on cutc_profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- is_admin() helper — used throughout RLS policies below
-- ============================================================================
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from cqg_profiles
    where id = auth.uid() and tier = 'admin'
  );
$$;

-- ============================================================================
-- Prevent self-elevation: RLS lets a user UPDATE their own cqg_profiles row,
-- but doesn't restrict which columns — without this, any signed-in user
-- could set their own `tier` to 'admin' directly from the browser console.
-- A BEFORE UPDATE trigger checking the JWT role (auth.role()) is used here
-- rather than a column-level REVOKE — REVOKE was tried first but proved to
-- have no effect on a live project for reasons not worth chasing down;
-- checking the actual request role is deterministic regardless of whatever
-- caused that. service_role (admin Server Actions) passes through freely.
-- ============================================================================
create or replace function prevent_self_tier_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.tier is distinct from old.tier then
    raise exception 'only admins can change tier';
  end if;

  if new.email is distinct from old.email then
    raise exception 'email cannot be changed directly';
  end if;

  return new;
end;
$$;

create trigger cqg_profiles_protect_tier_email
  before update on cqg_profiles
  for each row execute function prevent_self_tier_email_change();

-- ============================================================================
-- Event application business logic (atomic via SECURITY DEFINER functions,
-- called from Server Actions instead of implementing this in application code,
-- so capacity/waitlist handling stays correct under concurrent requests)
-- ============================================================================

create or replace function cqg_event_accepted_count(p_event_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer from cqg_event_applications
  where event_id = p_event_id and status = 'accepted';
$$;

create or replace function cqg_event_promote_waitlist(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_next_id uuid;
begin
  select capacity into v_capacity from cqg_events where id = p_event_id;
  if v_capacity is null then
    return; -- unlimited, nothing to promote against
  end if;

  while cqg_event_accepted_count(p_event_id) < v_capacity loop
    select id into v_next_id from cqg_event_applications
      where event_id = p_event_id and status = 'waitlisted'
      order by applied_at asc
      limit 1;
    exit when v_next_id is null;
    update cqg_event_applications set status = 'accepted' where id = v_next_id;
  end loop;
end;
$$;

-- Apply to an event as the currently-authenticated CQG user.
create or replace function cqg_event_apply(p_event_id uuid)
returns cqg_event_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile cqg_profiles;
  v_capacity integer;
  v_locked boolean;
  v_status event_application_status;
  v_row cqg_event_applications;
begin
  select * into v_profile from cqg_profiles where id = auth.uid();
  if v_profile is null then
    raise exception 'no CQG profile for current user';
  end if;

  select capacity, applications_locked into v_capacity, v_locked
    from cqg_events where id = p_event_id;
  if v_capacity is null and v_locked is null then
    raise exception 'event not found';
  end if;

  -- lock the event row for the duration of this decision to avoid a race
  -- between two applicants both seeing an open spot
  perform 1 from cqg_events where id = p_event_id for update;

  if v_profile.tier in ('member', 'admin') then
    if v_capacity is null or cqg_event_accepted_count(p_event_id) < v_capacity then
      v_status := 'accepted';
    else
      v_status := 'waitlisted';
    end if;
  else
    v_status := 'pending';
  end if;

  insert into cqg_event_applications (event_id, profile_id, status)
  values (p_event_id, v_profile.id, v_status)
  returning * into v_row;

  return v_row;
end;
$$;

-- Withdraw an application (only the owner, only before the event is locked).
create or replace function cqg_event_withdraw(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app cqg_event_applications;
  v_locked boolean;
begin
  select * into v_app from cqg_event_applications where id = p_application_id;
  if v_app is null or v_app.profile_id != auth.uid() then
    raise exception 'not your application';
  end if;

  select applications_locked into v_locked from cqg_events where id = v_app.event_id;
  if v_locked then
    raise exception 'applications are locked for this event';
  end if;

  perform 1 from cqg_events where id = v_app.event_id for update;

  update cqg_event_applications set status = 'withdrawn' where id = p_application_id;

  if v_app.status = 'accepted' then
    perform cqg_event_promote_waitlist(v_app.event_id);
  end if;
end;
$$;

-- Admin approves/rejects a pending application.
create or replace function cqg_event_decide(p_application_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app cqg_event_applications;
  v_capacity integer;
begin
  if not is_admin() then
    raise exception 'admin only';
  end if;

  select * into v_app from cqg_event_applications where id = p_application_id;
  if v_app is null then
    raise exception 'application not found';
  end if;

  perform 1 from cqg_events where id = v_app.event_id for update;

  if not p_approve then
    update cqg_event_applications
      set status = 'rejected', decided_at = now(), decided_by = auth.uid()
      where id = p_application_id;
    return;
  end if;

  select capacity into v_capacity from cqg_events where id = v_app.event_id;
  if v_capacity is null or cqg_event_accepted_count(v_app.event_id) < v_capacity then
    update cqg_event_applications
      set status = 'accepted', decided_at = now(), decided_by = auth.uid()
      where id = p_application_id;
  else
    update cqg_event_applications
      set status = 'waitlisted', decided_at = now(), decided_by = auth.uid()
      where id = p_application_id;
  end if;
end;
$$;

-- Admin marks attendance.
create or replace function cqg_event_set_attendance(p_application_id uuid, p_attended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'admin only';
  end if;

  update cqg_event_applications
    set attended = p_attended, attended_marked_at = now(), attended_marked_by = auth.uid()
    where id = p_application_id;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table cqg_profiles enable row level security;
alter table cqg_membership_cycles enable row level security;
alter table cqg_membership_applications enable row level security;
alter table cutc_profiles enable row level security;
alter table cutc_cycles enable row level security;
alter table cutc_applications enable row level security;
alter table cqg_events enable row level security;
alter table cqg_event_applications enable row level security;
alter table email_blasts enable row level security;
alter table email_blast_recipients enable row level security;

-- cqg_profiles: owner full select/update of their own row; admin full select.
-- Column-level lockdown of `tier`/`email` (so a user can't self-elevate) is
-- the prevent_self_tier_email_change trigger defined above, not RLS itself.
create policy cqg_profiles_select_own on cqg_profiles for select using (id = auth.uid());
create policy cqg_profiles_select_admin on cqg_profiles for select using (is_admin());
create policy cqg_profiles_update_own on cqg_profiles for update using (id = auth.uid());
create policy cqg_profiles_insert_own on cqg_profiles for insert with check (id = auth.uid());

-- Belt-and-suspenders alongside the trigger above — harmless if redundant.
revoke update (tier, email) on cqg_profiles from authenticated;

create policy cqg_cycles_select_all on cqg_membership_cycles for select using (auth.uid() is not null);
create policy cqg_cycles_admin_write on cqg_membership_cycles for all using (is_admin()) with check (is_admin());

create policy cqg_apps_select_own on cqg_membership_applications for select using (profile_id = auth.uid());
create policy cqg_apps_select_admin on cqg_membership_applications for select using (is_admin());
create policy cqg_apps_insert_own on cqg_membership_applications for insert with check (profile_id = auth.uid());
create policy cqg_apps_admin_write on cqg_membership_applications for update using (is_admin()) with check (is_admin());

create policy cutc_profiles_select_own on cutc_profiles for select using (id = auth.uid());
create policy cutc_profiles_select_admin on cutc_profiles for select using (is_admin());
create policy cutc_profiles_update_own on cutc_profiles for update using (id = auth.uid());
create policy cutc_profiles_insert_own on cutc_profiles for insert with check (id = auth.uid());

create policy cutc_cycles_select_all on cutc_cycles for select using (auth.uid() is not null);
create policy cutc_cycles_admin_write on cutc_cycles for all using (is_admin()) with check (is_admin());

create policy cutc_apps_select_own_cqg on cutc_applications for select using (cqg_profile_id = auth.uid());
create policy cutc_apps_select_own_external on cutc_applications for select using (cutc_profile_id = auth.uid());
create policy cutc_apps_select_admin on cutc_applications for select using (is_admin());
create policy cutc_apps_insert_own_cqg on cutc_applications for insert with check (cqg_profile_id = auth.uid());
create policy cutc_apps_insert_own_external on cutc_applications for insert with check (cutc_profile_id = auth.uid());
create policy cutc_apps_admin_write on cutc_applications for update using (is_admin()) with check (is_admin());

create policy cqg_events_select_all on cqg_events for select using (auth.uid() is not null);
create policy cqg_events_admin_write on cqg_events for all using (is_admin()) with check (is_admin());

create policy event_apps_select_own on cqg_event_applications for select using (profile_id = auth.uid());
create policy event_apps_select_admin on cqg_event_applications for select using (is_admin());
-- writes to cqg_event_applications happen only through the SECURITY DEFINER
-- functions above, which already enforce ownership/admin — no direct
-- insert/update policy is granted here on purpose.

create policy email_blasts_admin_only on email_blasts for all using (is_admin()) with check (is_admin());
create policy email_blast_recipients_admin_only on email_blast_recipients for all using (is_admin()) with check (is_admin());

-- ============================================================================
-- Storage: private resumes bucket
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Path convention: resumes/cqg/{user_id}/{filename} and resumes/cutc/{user_id}/{filename}
create policy resumes_owner_all on storage.objects for all
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] in ('cqg', 'cutc')
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] in ('cqg', 'cutc')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy resumes_admin_read on storage.objects for select
  using (bucket_id = 'resumes' and is_admin());

-- ============================================================================
-- Seed the first admin. Update this email if needed before running.
-- This only takes effect once that user has signed up (the row is updated,
-- not inserted) — run it again after they create their account if it does
-- nothing the first time.
-- ============================================================================
update cqg_profiles set tier = 'admin' where email = 'nip2106@columbia.edu';

-- ============================================================================
-- NOTE on scheduled email dispatch: the actual Cron job is registered
-- separately via Supabase's Database -> Cron UI (or `cron.schedule(...)` if
-- you prefer SQL), pointing at the app's /api/blasts/dispatch route. See
-- the setup instructions accompanying this migration.
-- ============================================================================
