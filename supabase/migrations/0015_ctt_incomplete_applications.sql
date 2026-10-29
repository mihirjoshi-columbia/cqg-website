-- Applications we create on someone's behalf (the final list included people who never applied,
-- so their account and a pre-filled application are made for them) start with
-- details_complete = false. They finish the missing questions from their dashboard through
-- complete_ctt_application below. Every other application defaults to complete.
--
-- Run after 0014_ctt_offers.sql.

alter table ctt_applications
  add column if not exists details_complete boolean not null default true;

-- The applicant fills in the rest of their own application. Applicants have no UPDATE
-- policy on ctt_applications, so (like respond_ctt_offer) this SECURITY DEFINER function is
-- the one way they can write to the row; it only works on their own incomplete external
-- application. It also records their undergrad attestation on the profile.
create or replace function complete_ctt_application(
  p_application_id uuid,
  p_college text,
  p_major text,
  p_grad_year text,
  p_country text,
  p_gender text,
  p_prior_internship boolean,
  p_internship_lined_up boolean,
  p_internship_location text,
  p_travel_needed boolean,
  p_lodging_needed boolean,
  p_attestation boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app ctt_applications%rowtype;
begin
  select * into v_app from ctt_applications where id = p_application_id for update;

  if not found or v_app.ctt_profile_id is distinct from auth.uid() then
    raise exception 'application not found';
  end if;

  if v_app.details_complete then
    return;
  end if;

  if not p_attestation then
    raise exception 'attestation required';
  end if;

  update ctt_applications
    set college = p_college,
        major = p_major,
        grad_year = p_grad_year,
        country = p_country,
        gender = p_gender,
        prior_internship = p_prior_internship,
        internship_lined_up = p_internship_lined_up,
        internship_location = p_internship_location,
        travel_needed = p_travel_needed,
        lodging_needed = p_lodging_needed,
        details_complete = true
    where id = p_application_id;

  update ctt_profiles set attestation = true where id = auth.uid();
end;
$$;

revoke all on function complete_ctt_application(uuid, text, text, text, text, text, boolean, boolean, text, boolean, boolean, boolean) from public;
grant execute on function complete_ctt_application(uuid, text, text, text, text, text, boolean, boolean, text, boolean, boolean, boolean) to authenticated;
