-- Rename the competition (CUTC -> CTT, "Columbia Trading Tournament") across
-- the database: tables, column, enum type/values, constraints, indexes,
-- triggers, policies, and the resume storage path convention.
--
-- Run order (see scripts/move-ctt-resumes.mjs): `copy` the storage objects
-- first, run this migration, deploy the code, then `cleanup` the old objects.
-- This migration assumes the copies under resumes/ctt/<user_id>/ already exist.

alter table cutc_profiles rename to ctt_profiles;
alter table cutc_cycles rename to ctt_cycles;
alter table cutc_applications rename to ctt_applications;

alter table ctt_applications rename column cutc_profile_id to ctt_profile_id;

alter type cutc_applicant_type rename to ctt_applicant_type;
alter type blast_segment_type rename value 'cutc_group' to 'ctt_group';
alter type profile_kind rename value 'cutc' to 'ctt';

-- Auto-named constraints (pkey/unique/fkey) and any explicitly named ones.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass::text as tbl, c.conname
    from pg_constraint c
    where c.conrelid in ('ctt_profiles'::regclass, 'ctt_cycles'::regclass, 'ctt_applications'::regclass)
      and c.conname like '%cutc%'
  loop
    execute format('alter table %s rename constraint %I to %I', r.tbl, r.conname, replace(r.conname, 'cutc', 'ctt'));
  end loop;
end $$;

-- Standalone indexes (those not already renamed along with a constraint).
do $$
declare r record;
begin
  for r in
    select indexname from pg_indexes
    where schemaname = 'public' and indexname like '%cutc%'
  loop
    execute format('alter index %I rename to %I', r.indexname, replace(r.indexname, 'cutc', 'ctt'));
  end loop;
end $$;

alter trigger cutc_profiles_set_updated_at on ctt_profiles rename to ctt_profiles_set_updated_at;

-- RLS policies (they follow the table through the rename; only the names change).
do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('ctt_profiles', 'ctt_cycles', 'ctt_applications')
      and policyname like '%cutc%'
  loop
    execute format('alter policy %I on %I rename to %I', r.policyname, r.tablename, replace(r.policyname, 'cutc', 'ctt'));
  end loop;
end $$;

-- Storage: the owner policy hard-codes the allowed top-level folders.
drop policy if exists resumes_owner_all on storage.objects;
create policy resumes_owner_all on storage.objects for all
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] in ('cqg', 'ctt')
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] in ('cqg', 'ctt')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

update ctt_profiles
  set resume_path = 'ctt/' || substr(resume_path, length('cutc/') + 1)
  where resume_path like 'cutc/%';
