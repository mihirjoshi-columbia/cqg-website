-- A game contest can stay open forever: closes_at null means it never closes.
-- The Distribution Desk homework uses this (supabase/seed_dd_contests.sql).

alter table cqg_game_contests
  alter column closes_at drop not null;

alter table cqg_game_contests
  drop constraint if exists closes_after_opens;

alter table cqg_game_contests
  add constraint closes_after_opens
  check (closes_at is null or closes_at > opens_at);
