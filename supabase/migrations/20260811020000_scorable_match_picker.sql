create or replace function public.list_scorable_player_matches(actor_user_id uuid)
returns table (
  player_match_id uuid,
  season_id uuid,
  season_name text,
  round_id uuid,
  round_number integer,
  scheduled_on date,
  team_match_id uuid,
  slot_number integer,
  status text,
  team_a_name text,
  team_b_name text,
  player_a_name text,
  player_b_name text,
  editable_side text
)
language sql
stable
security definer
set search_path = ''
as $$
  with actor as (
    select p.id as player_id
    from public.players p
    where p.user_id = actor_user_id
    limit 1
  ), eligible as (
    select
      pm.*,
      case
        when bool_or(tm.team_id = pm.team_a_id) and not bool_or(tm.team_id = pm.team_b_id) then 'A'
        when bool_or(tm.team_id = pm.team_b_id) and not bool_or(tm.team_id = pm.team_a_id) then 'B'
        else null
      end as editable_side
    from public.player_matches pm
    join actor a on true
    join public.team_memberships tm
      on tm.player_id = a.player_id
     and tm.season_id = pm.season_id
     and tm.ends_at is null
     and tm.team_id in (pm.team_a_id, pm.team_b_id)
    where pm.status not in ('finalized', 'corrected')
    group by pm.id
  )
  select
    e.id,
    e.season_id,
    s.name,
    e.round_id,
    r.round_number,
    r.scheduled_on,
    e.team_match_id,
    e.slot_number,
    e.status,
    ta.name,
    tb.name,
    pa.display_name,
    pb.display_name,
    e.editable_side
  from eligible e
  join public.seasons s on s.id = e.season_id
  join public.rounds r on r.id = e.round_id
  join public.teams ta on ta.id = e.team_a_id
  join public.teams tb on tb.id = e.team_b_id
  join public.players pa on pa.id = e.player_a_id
  join public.players pb on pb.id = e.player_b_id
  where e.editable_side is not null
  order by
    case when r.scheduled_on >= current_date then 0 else 1 end,
    abs(r.scheduled_on - current_date),
    r.round_number,
    e.slot_number;
$$;

revoke all on function public.list_scorable_player_matches(uuid) from public;
grant execute on function public.list_scorable_player_matches(uuid) to service_role;

comment on function public.list_scorable_player_matches(uuid) is
  'Service-role-only read model listing revealed, unfinished player matches an authenticated active teammate may score for their own team side.';
