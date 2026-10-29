-- CTT offers: after review, selected applicants get an offer they have 24 hours to
-- accept. Flow: pending -> offered -> accepted | declined | expired.
--
-- 'approved' / 'rejected' keep their meaning. The new values are added to the shared
-- application_status enum (the Internal Membership table uses it too, but never sets them).
--
-- Run this whole file in the Supabase SQL editor. The new enum values are only used
-- inside the function body below (resolved when it runs), not in this transaction.

alter type application_status add value if not exists 'offered';
alter type application_status add value if not exists 'accepted';
alter type application_status add value if not exists 'declined';
alter type application_status add value if not exists 'expired';

alter table ctt_applications
  add column if not exists offered_at timestamptz,
  add column if not exists offer_expires_at timestamptz,
  add column if not exists responded_at timestamptz;

-- The applicant answers their own offer. Applicants have no UPDATE policy on
-- ctt_applications (only admins do), so this SECURITY DEFINER function is the one
-- way they can change a row: ownership and the deadline are enforced here, in one
-- place, and only an 'offered' row can be answered.
--
-- Returns the application's status afterwards: 'accepted' / 'declined', or
-- 'expired' if the 24 hours had already passed, or whatever it already was.
create or replace function respond_ctt_offer(p_application_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app ctt_applications%rowtype;
begin
  select * into v_app from ctt_applications where id = p_application_id for update;

  if not found or not (v_app.cqg_profile_id = auth.uid() or v_app.ctt_profile_id = auth.uid()) then
    raise exception 'application not found';
  end if;

  if v_app.status::text <> 'offered' then
    return v_app.status::text;
  end if;

  if v_app.offer_expires_at is null or v_app.offer_expires_at <= now() then
    update ctt_applications set status = 'expired' where id = p_application_id;
    return 'expired';
  end if;

  update ctt_applications
    set status = (case when p_accept then 'accepted' else 'declined' end)::application_status,
        responded_at = now()
    where id = p_application_id;

  return case when p_accept then 'accepted' else 'declined' end;
end;
$$;

revoke all on function respond_ctt_offer(uuid, boolean) from public;
grant execute on function respond_ctt_offer(uuid, boolean) to authenticated;
