-- cqg_profiles_update_own (0001) lets a user UPDATE their own row via RLS,
-- but RLS doesn't restrict individual columns — as written, any signed-in
-- user could set their own `tier` to 'admin' or rewrite their own `email`
-- directly from the browser console. Column-level REVOKE closes that: the
-- `authenticated` role (everything RLS governs) loses UPDATE on these two
-- columns specifically; `service_role` (used by admin Server Actions) is
-- unaffected and can still change them.
revoke update (tier, email) on public.cqg_profiles from authenticated;
