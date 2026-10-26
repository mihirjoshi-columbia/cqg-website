-- Creates the Distribution Desk homework. Run in the Supabase SQL editor
-- after migration 0014.
--
-- Safe to re-run: the insert upserts on the slug, so editing a date here and
-- running it again updates the live homework. The row keeps its id, so
-- attempts already recorded against it stay attached and nobody loses a
-- result.
--
-- `preset` must name a preset in lib/game/dd/presets.ts. There is exactly one
-- ('homework'), and it carries the fixed seed set from lib/game/dd/seeds.ts,
-- so every student is dealt identical contracts. attempts_allowed is 3 and
-- the leaderboard ranks each student's BEST completed attempt, but an attempt
-- is spent when the run is DEALT -- so abandoning one still costs it, and
-- nobody can re-roll until they like the deal.
--
-- Standings are live from the start, which is the right call for homework:
-- students should see the field move. The deal is identical for everyone, so
-- say plainly that comparing settlements with a classmate is cheating -- the
-- code cannot stop it.
insert into cqg_game_contests
  (slug, game, preset, label, opens_at, closes_at, leaderboard_visible_at, attempts_allowed)
values
  (
    'week3',
    'dd',
    'homework',
    'Week 3 — Distribution Desk',
    '2026-10-26 00:00:00-04',
    '2026-11-02 23:59:00-05',
    '2026-10-26 00:00:00-04',
    3
  )
on conflict (slug) do update set
  preset = excluded.preset,
  label = excluded.label,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  leaderboard_visible_at = excluded.leaderboard_visible_at,
  attempts_allowed = excluded.attempts_allowed;
