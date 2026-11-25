-- Instant RSVP events (e.g. the Columbia Quant Fair): anyone with a CQG account is confirmed
-- straight away instead of waiting for review. Capacity and the waitlist still apply when set.
--
-- Run this whole file in the Supabase SQL editor.

alter table cqg_events
  add column if not exists instant_rsvp boolean not null default false;

-- Same function as migration 0001, except an event with instant_rsvp confirms every tier
-- (not just members and admins). Everyone else is still 'pending' on other events.
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
  v_status event_application_status;
  v_row cqg_event_applications;
begin
  select * into v_profile from cqg_profiles where id = auth.uid();
  if v_profile is null then
    raise exception 'no CQG profile for current user';
  end if;

  select capacity, applications_locked, instant_rsvp into v_capacity, v_locked, v_instant
    from cqg_events where id = p_event_id;
  if v_capacity is null and v_locked is null then
    raise exception 'event not found';
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
