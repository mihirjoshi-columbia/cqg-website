-- Distribution Desk becomes unlimited practice, and the ranking changes with
-- it.
--
-- 0017 allowed a few attempts ranked on the best. Two things made that the
-- wrong shape. First, every run was dealt the IDENTICAL seven contracts, so a
-- capped set of attempts was the only thing stopping a player from grinding
-- the same known answers; now the contracts themselves are generated per run
-- (lib/game/dd/deal.ts), so there is nothing to memorise and no reason to
-- ration practice. Second, "best of N" plus unlimited N ranks whoever played
-- most: with a fresh deal each time, the maximum of many samples converges on
-- the luckiest deal rather than the best player.
--
-- So: attempts_allowed null means unlimited, and the leaderboard ranks the
-- MEAN of a player's last five completed runs. An average cannot be improved
-- by volume, only by playing better, and five is enough to damp a single
-- freak deal without making the number slow to move.
--
-- Attempts are still recorded when a run is DEALT, so an abandoned run is a
-- row with no score. Quitting a deal you do not like therefore does nothing
-- for your average -- it is not a re-roll, it is a run you did not finish.

alter table cqg_game_contests
  alter column attempts_allowed drop not null;

-- `if exists` so a partially-applied run of this file can be re-run: the drop
-- and the add below use the SAME constraint name, so on a second pass the
-- drop finds the new constraint and the pair is a no-op.
alter table cqg_game_contests
  drop constraint if exists attempts_positive;

alter table cqg_game_contests
  add constraint attempts_positive
  check (attempts_allowed is null or attempts_allowed >= 1);

alter table cqg_game_contests
  alter column attempts_allowed drop default;

-- The leaderboard reads a window of each player's recent completed runs.
create index if not exists cqg_game_attempts_recent_idx
  on cqg_game_attempts (contest_id, profile_id, completed_at desc nulls last);

-- ============================================================================
-- Leaderboard: one row per person, the mean of their last five completed runs.
--
-- Dropped and recreated rather than replaced: the result set gains a `runs`
-- column, and Postgres will not let create-or-replace change a return type.
-- ============================================================================
drop function if exists dd_leaderboard(text);

create function dd_leaderboard(p_slug text)
returns table (
  rank bigint,
  profile_id uuid,
  name text,
  score numeric,
  runs bigint,
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
    with recent as (
      select
        a.profile_id as pid,
        a.score as sc,
        a.completed_at as done,
        -- `a.id` only breaks ties. Two attempts can finish inside the same
        -- timestamp, and without a tiebreaker which of them falls outside the
        -- five-run window is arbitrary, so a player's average could move
        -- between two refreshes with no new runs played.
        row_number() over (
          partition by a.profile_id
          order by a.completed_at desc, a.id desc
        ) as rn
      from cqg_game_attempts a
      where a.contest_id = v_contest.id
        and a.completed_at is not null
        and a.score is not null
    ),
    windowed as (
      select
        r.pid,
        avg(r.sc) as sc,
        count(*) as runs,
        max(r.done) as done
      from recent r
      -- Five, matching RANKED_RUNS in lib/game/dd/contests.ts. Changing one
      -- without the other would show a player a different number from the one
      -- they are ranked on.
      where r.rn <= 5
      group by r.pid
    )
    select
      rank() over (order by w.sc desc) as rank,
      w.pid,
      p.name,
      w.sc,
      w.runs,
      w.done
    from windowed w
    join cqg_profiles p on p.id = w.pid
    order by w.sc desc, w.done asc;
end;
$$;

revoke all on function dd_leaderboard(text) from public;
grant execute on function dd_leaderboard(text) to authenticated;
