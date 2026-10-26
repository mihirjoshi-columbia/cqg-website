-- Distribution Desk moves from one attempt to several, ranked on the best.
--
-- 0014 allowed exactly one attempt per person per contest, enforced by a
-- unique (contest_id, profile_id) index. That made a misclick or a closed tab
-- cost the whole assignment, which punishes the interface rather than the
-- maths. Several attempts ranked on the best keeps the thing that matters --
-- the attempt is still recorded when the run is DEALT, so abandoning a run
-- still consumes one and nobody can re-roll until they like the deal -- while
-- letting a student who fumbled the first contract try again.
--
-- Each attempt is its own row, rather than a counter on one row, so every
-- run's quotes and breakdown are kept. That is what lets a score be
-- recomputed by replay, and lets you see whether someone improved or just
-- got a luckier fill.

alter table cqg_game_attempts
  drop constraint cqg_game_attempts_contest_id_profile_id_key;

alter table cqg_game_attempts
  add column attempt_number integer not null default 1;

alter table cqg_game_attempts
  add constraint cqg_game_attempts_number_positive check (attempt_number >= 1);

-- The real guard against two tabs starting at once: both compute the same
-- next number, and exactly one insert survives.
alter table cqg_game_attempts
  add constraint cqg_game_attempts_contest_profile_number_key
  unique (contest_id, profile_id, attempt_number);

-- ============================================================================
-- Leaderboard: one row per person, their BEST completed attempt.
-- ============================================================================
create or replace function dd_leaderboard(p_slug text)
returns table (
  rank bigint,
  profile_id uuid,
  name text,
  score numeric,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contest cqg_game_contests;
  v_tier cqg_tier;
begin
  select * into v_contest from cqg_game_contests where slug = p_slug;
  if not found then
    raise exception 'unknown contest %', p_slug using errcode = 'no_data_found';
  end if;

  select p.tier into v_tier from cqg_profiles p where p.id = auth.uid();
  if v_tier is null or v_tier not in ('member', 'admin') then
    raise exception 'Internal Members only' using errcode = 'insufficient_privilege';
  end if;

  if now() < v_contest.leaderboard_visible_at and v_tier <> 'admin' then
    raise exception 'leaderboard is not published yet' using errcode = 'insufficient_privilege';
  end if;

  return query
    with best as (
      -- distinct on keeps the single best row per person, so completed_at is
      -- the time of THAT attempt rather than of some other one.
      select distinct on (a.profile_id)
        a.profile_id as pid,
        a.score as sc,
        a.completed_at as done
      from cqg_game_attempts a
      where a.contest_id = v_contest.id
        and a.completed_at is not null
      order by a.profile_id, a.score desc, a.completed_at asc
    )
    select
      rank() over (order by b.sc desc) as rank,
      b.pid,
      p.name,
      b.sc,
      b.done
    from best b
    join cqg_profiles p on p.id = b.pid
    order by b.sc desc, b.done asc;
end;
$$;

revoke all on function dd_leaderboard(text) from public;
grant execute on function dd_leaderboard(text) to authenticated;
