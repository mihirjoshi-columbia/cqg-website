-- 0002's column-level REVOKE did not actually block the exploit when
-- re-tested live (a test account was able to set its own tier to 'admin'
-- via a direct PostgREST call even after the REVOKE was run) — something
-- about how Supabase's role grants are set up on this project meant the
-- REVOKE had no effect, and it wasn't worth the time to root-cause exactly
-- why. A BEFORE UPDATE trigger is a more deterministic mechanism: it checks
-- the actual JWT role Supabase attaches to the request (auth.role()) rather
-- than relying on Postgres column privilege resolution, so it isn't
-- sensitive to whatever role-inheritance setup caused the REVOKE to be a
-- no-op. service_role (used by admin Server Actions) is explicitly allowed
-- through; every other caller is blocked from changing tier or email.
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

drop trigger if exists cqg_profiles_protect_tier_email on cqg_profiles;
create trigger cqg_profiles_protect_tier_email
  before update on cqg_profiles
  for each row execute function prevent_self_tier_email_change();
