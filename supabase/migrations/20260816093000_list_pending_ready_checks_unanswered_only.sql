-- "Pending" means the actor still needs to respond (open checks they already answered were noisy).

create or replace function public.list_my_pending_ready_checks(actor_user_id uuid)
returns table (
  id uuid,
  season_id uuid,
  round_id uuid,
  team_id uuid,
  team_name text,
  round_number integer,
  scheduled_on date,
  started_by_display_name text,
  created_at timestamptz,
  my_response text
)
language plpgsql
security definer
set search_path to ''
as $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then
    return;
  end if;

  return query
  select
    trc.id,
    trc.season_id,
    trc.round_id,
    trc.team_id,
    t.name as team_name,
    r.round_number,
    r.scheduled_on,
    starter.display_name as started_by_display_name,
    trc.created_at,
    resp.response as my_response
  from private.team_ready_checks trc
  join public.teams t on t.id = trc.team_id and t.season_id = trc.season_id
  join public.rounds r on r.id = trc.round_id and r.season_id = trc.season_id
  join public.players starter on starter.id = trc.started_by_player_id
  join public.team_memberships tm
    on tm.team_id = trc.team_id
   and tm.season_id = trc.season_id
   and tm.player_id = actor_player_id
   and tm.ends_at is null
  left join private.team_ready_check_responses resp
    on resp.ready_check_id = trc.id
   and resp.player_id = actor_player_id
  where trc.status = 'open'
    and resp.response is null
  order by trc.created_at desc;
end;
$function$;
