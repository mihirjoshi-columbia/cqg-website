-- Event promotion: an event flagged "promote on homepage" gets the homepage banner, hero button,
-- portal dashboard card and sign-up guide automatically, until it ends or RSVPs are locked.
-- Also adds an Undergraduate / Graduate / everyone setting that is enforced when someone RSVPs.
--
-- Run this whole file in the Supabase SQL editor.

alter table cqg_events
  add column if not exists promote_on_home boolean not null default false,
  add column if not exists promo_banner_text text,
  add column if not exists promo_button_label text,
  add column if not exists promo_color text not null default 'pink',
  add column if not exists promo_audience text,
  add column if not exists eligibility text not null default 'all';

alter table cqg_events drop constraint if exists cqg_events_promo_color_check;
alter table cqg_events
  add constraint cqg_events_promo_color_check check (promo_color in ('pink', 'lime', 'sky'));

alter table cqg_events drop constraint if exists cqg_events_eligibility_check;
alter table cqg_events
  add constraint cqg_events_eligibility_check check (eligibility in ('all', 'undergraduate', 'graduate'));

-- Same function as migration 0022, plus the eligibility check. Undergraduate means school
-- CC / SEAS / Barnard / GS; graduate means GRAD. Admins are never blocked. The messages that
-- start with "eligibility:" are shown to the person as-is by the portal.
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
  v_instant boolean;
  v_eligibility text;
  v_status event_application_status;
  v_row cqg_event_applications;
begin
  select * into v_profile from cqg_profiles where id = auth.uid();
  if v_profile is null then
    raise exception 'no CQG profile for current user';
  end if;

  select capacity, applications_locked, instant_rsvp, eligibility
    into v_capacity, v_locked, v_instant, v_eligibility
    from cqg_events where id = p_event_id;
  if not found then
    raise exception 'event not found';
  end if;

  if v_profile.tier <> 'admin' then
    if v_eligibility = 'undergraduate' and (v_profile.school is null or v_profile.school = 'GRAD') then
      raise exception 'eligibility: This event is open to undergraduate students only.';
    end if;
    if v_eligibility = 'graduate' and (v_profile.school is null or v_profile.school <> 'GRAD') then
      raise exception 'eligibility: This event is open to graduate students only.';
    end if;
  end if;

  -- lock the event row for the duration of this decision to avoid a race
  -- between two applicants both seeing an open spot
  perform 1 from cqg_events where id = p_event_id for update;

  if v_instant or v_profile.tier in ('member', 'admin') then
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

-- Move the Columbia Quant Fair onto the new system (it was hard-coded on the site before).
update cqg_events
set promote_on_home = true,
    promo_banner_text = 'RSVP: the inaugural Columbia Quant Fair',
    promo_button_label = 'RSVP to the Columbia Quant Fair · Dec 5',
    promo_color = 'pink',
    promo_audience = 'Columbia & Barnard students',
    eligibility = 'all'
where lower(title) = 'columbia quant fair';
