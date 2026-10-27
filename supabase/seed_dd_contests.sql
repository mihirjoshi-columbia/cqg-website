-- Creates the Distribution Desk practice set. Run in the Supabase SQL editor
-- after migration 0016.
--
-- Safe to re-run: the insert upserts on the slug, so editing a date here and
-- running it again updates the live homework. The row keeps its id, so
-- attempts already recorded against it stay attached and nobody loses a
-- result.
--
-- `preset` must name a preset in lib/game/dd/presets.ts. There is exactly one
-- ('homework'); it no longer carries a contract list, because every run is
-- dealt its own freshly generated six (lib/game/dd/deal.ts).
--
-- attempts_allowed is NULL, meaning unlimited: there are no fixed answers to
-- grind, so practice is not rationed. The leaderboard ranks the mean of each
-- player's last five COMPLETED runs, so nobody climbs it by volume.
--
-- Standings are live from the start. Deals differ per run, so there is
-- nothing a classmate can tell you that helps.
insert into cqg_game_contests
  (slug, game, preset, label, opens_at, closes_at, leaderboard_visible_at, attempts_allowed)
values
  (
    'week3',
    'dd',
    'homework',
    'Distribution Desk — practice',
    '2026-10-26 00:00:00-04',
    '2027-06-30 23:59:00-04',
    '2026-10-26 00:00:00-04',
    null
  )
on conflict (slug) do update set
  preset = excluded.preset,
  label = excluded.label,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  leaderboard_visible_at = excluded.leaderboard_visible_at,
  attempts_allowed = excluded.attempts_allowed;
