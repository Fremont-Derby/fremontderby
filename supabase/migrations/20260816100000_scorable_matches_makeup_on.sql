-- #371 Score hub: expose team-match makeup play date on scorable matches.
-- Lane clones applied live; public baseline below.

drop function if exists public.list_scorable_player_matches(uuid);

create or replace function public.list_scorable_player_matches(actor_user_id uuid)
returns table (
  player_match_id uuid,
  season_id uuid,
  season_name text,
  round_id uuid,
  round_number integer,
  scheduled_on date,
  makeup_on date,
  makeup_status text,
  team_match_id uuid,
  slot_number integer,
  status text,
  team_a_name text,
  team_b_name text,
  player_a_name text,
  player_b_name text,
  scoring_team_id uuid,
  scoring_team_name text,
  editable_side text
)
language sql
stable
security definer
set search_path = ''
as $$
  with actor as (
    select p.id as player_id from public.players p where p.user_id = actor_user_id limit 1
  ),
  ranked as (
    select
      pm.id as player_match_id,
      pm.season_id,
      s.name as season_name,
      pm.round_id,
      r.round_number,
      r.scheduled_on,
      tmatch.makeup_on,
      tmatch.makeup_status,
      pm.team_match_id,
      pm.slot_number,
      pm.status,
      ta.name as team_a_name,
      tb.name as team_b_name,
      pa.display_name as player_a_name,
      pb.display_name as player_b_name,
      tm.team_id as scoring_team_id,
      case when tm.team_id = pm.team_a_id then ta.name else tb.name end as scoring_team_name,
      case when tm.team_id = pm.team_a_id then 'A' else 'B' end as editable_side,
      row_number() over (
        partition by pm.id
        order by case when tm.role = 'captain' then 0 else 1 end, tm.team_id
      ) as rn
    from public.player_matches pm
    join actor a on true
    join public.team_memberships tm
      on tm.player_id = a.player_id
     and tm.season_id = pm.season_id
     and tm.ends_at is null
     and tm.team_id in (pm.team_a_id, pm.team_b_id)
    join public.seasons s on s.id = pm.season_id
    join public.rounds r on r.id = pm.round_id
    left join public.team_matches tmatch on tmatch.id = pm.team_match_id
    join public.teams ta on ta.id = pm.team_a_id
    join public.teams tb on tb.id = pm.team_b_id
    join public.players pa on pa.id = pm.player_a_id
    join public.players pb on pb.id = pm.player_b_id
    where pm.status not in ('finalized', 'corrected')
  )
  select
    player_match_id, season_id, season_name, round_id, round_number, scheduled_on, makeup_on, makeup_status,
    team_match_id, slot_number, status, team_a_name, team_b_name, player_a_name, player_b_name,
    scoring_team_id, scoring_team_name, editable_side
  from ranked
  where rn = 1
  order by
    case when coalesce(makeup_on, scheduled_on) >= current_date then 0 else 1 end,
    abs(coalesce(makeup_on, scheduled_on) - current_date),
    round_number,
    slot_number;
$$;

revoke all on function public.list_scorable_player_matches(uuid) from public, anon, authenticated;
grant execute on function public.list_scorable_player_matches(uuid) to service_role;
