-- Contests and attempts for the portal games, added for Distribution Desk
-- (lib/game/dd) and its Week 3 homework leaderboard.
--
-- Make the Market was deliberately databaseless: the hand rode with the
-- client in a sealed token and nothing was stored. Its own session.ts names
-- the hole that leaves -- "a player can abandon a hand and deal again until
-- they like the result, because statelessness means nothing remembers that
-- the first hand happened". That is tolerable for a practice game and fatal
-- for a ranked one, so a contest records the attempt the moment it is dealt.
--
-- The sealed-token design is otherwise unchanged: these tables hold the
-- ATTEMPT, never the in-flight run.

-- ============================================================================
-- Contests
-- ============================================================================
create table cqg_game_contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- Which game, so a later game can share these tables.
  game text not null default 'dd',
  -- Preset name inside that game (lib/game/dd/presets.ts).
  preset text not null,
  label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  -- Standings stay hidden until this moment. For homework it is set to the
  -- open, so students can watch the field move. Set it to the close instead
  -- for anything graded competitively: everyone is dealt the same contracts,
  -- which is what makes the ranking luck-free and also what makes early
  -- standings a leak.
  leaderboard_visible_at timestamptz not null,
  attempts_allowed integer not null default 1,
  created_at timestamptz not null default now(),
  constraint closes_after_opens check (closes_at > opens_at),
  constraint attempts_positive check (attempts_allowed >= 1)
);

-- ============================================================================
-- Attempts
--
-- The row is inserted when the run is DEALT, not when it is submitted, so
-- abandoning a run burns the attempt. `quotes` is kept so any score can be
-- recomputed from scratch by replaying it against the contest's seed set --
-- a score is never trusted from the client, and never needs to be.
-- ============================================================================
create table cqg_game_attempts (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references cqg_game_contests(id) on delete cascade,
  profile_id uuid not null references cqg_profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric,
  breakdown jsonb,
  quotes jsonb,
  unique (contest_id, profile_id)
);

create index cqg_game_attempts_contest_score_idx
  on cqg_game_attempts (contest_id, score desc nulls last);

-- ============================================================================
-- Row level security
--
-- Writes go only through the service-role client in the route handlers, which
-- re-check membership with checkInternalMember(). Following the precedent set
-- by cqg_event_applications in 0001_init.sql, no insert/update policy is
-- granted to `authenticated` on purpose: a player must not be able to write
-- their own score.
-- ============================================================================
alter table cqg_game_contests enable row level security;
alter table cqg_game_attempts enable row level security;

create policy game_contests_select_all on cqg_game_contests
  for select using (auth.uid() is not null);
create policy game_contests_admin_write on cqg_game_contests
  for all using (is_admin()) with check (is_admin());

create policy game_attempts_select_own on cqg_game_attempts
  for select using (profile_id = auth.uid());
create policy game_attempts_select_admin on cqg_game_attempts
  for select using (is_admin());

-- ============================================================================
-- Leaderboard
--
-- A SECURITY DEFINER function rather than a view, because the visibility rule
-- ("not before leaderboard_visible_at, unless you are an admin") is not
-- expressible as a row filter on the attempts table alone, and because it
-- must expose other members' names and scores WITHOUT opening up the rest of
-- cqg_profiles or cqg_game_attempts to a direct select.
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
    select
      rank() over (order by a.score desc) as rank,
      a.profile_id,
      p.name,
      a.score,
      a.completed_at
    from cqg_game_attempts a
    join cqg_profiles p on p.id = a.profile_id
    where a.contest_id = v_contest.id
      and a.completed_at is not null
    order by a.score desc, a.completed_at asc;
end;
$$;

revoke all on function dd_leaderboard(text) from public;
grant execute on function dd_leaderboard(text) to authenticated;
