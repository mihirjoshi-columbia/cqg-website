-- Creates the two Distribution Desk contests. Run in the Supabase SQL editor
-- after migration 0014.
--
-- Safe to re-run: each insert upserts on the slug, so editing a date here and
-- running it again updates the live contest. The row keeps its id, so attempts
-- already recorded against it stay attached and nobody loses a result.
--
-- Week 3 is set to be open NOW. The midpoint dates are still a guess -- edit
-- them when the date is fixed.
--
-- `preset` must name a preset in lib/game/dd/presets.ts, and each preset
-- carries its own fixed seed set from lib/game/dd/seeds.ts, so every student
-- is dealt identical contracts. attempts_allowed is 1 and the attempt is
-- recorded when the run is DEALT, so abandoning it does not buy a fresh deal.

-- Week 3 homework. Standings are live from the start: students are meant to
-- see the field move and have another go at the practice mode in response.
insert into cqg_game_contests
  (slug, game, preset, label, opens_at, closes_at, leaderboard_visible_at, attempts_allowed)
values
  (
    'week3',
    'dd',
    'contest',
    'Week 3 — Distribution Desk',
    '2026-10-26 00:00:00-04',
    '2026-11-02 23:59:00-05',
    '2026-10-26 00:00:00-04',
    1
  )
on conflict (slug) do update set
  preset = excluded.preset,
  label = excluded.label,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  leaderboard_visible_at = excluded.leaderboard_visible_at,
  attempts_allowed = excluded.attempts_allowed;

-- Midpoint evaluation. leaderboard_visible_at is set to the CLOSE, not the
-- open: everyone plays the same contracts, so publishing standings while the
-- contest is live would let a late player infer the outcomes from the scores
-- already posted. Admins can still see it early.
insert into cqg_game_contests
  (slug, game, preset, label, opens_at, closes_at, leaderboard_visible_at, attempts_allowed)
values
  (
    'midpoint',
    'dd',
    'midpoint',
    'Midpoint evaluation — Distribution Desk',
    '2026-11-17 00:00:00-05',
    '2026-11-24 23:59:00-05',
    '2026-11-24 23:59:00-05',
    1
  )
on conflict (slug) do update set
  preset = excluded.preset,
  label = excluded.label,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  leaderboard_visible_at = excluded.leaderboard_visible_at,
  attempts_allowed = excluded.attempts_allowed;
