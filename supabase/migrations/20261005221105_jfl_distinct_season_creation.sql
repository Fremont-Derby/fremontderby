-- #3318: JFL-only explicit creation; legacy configure remains unchanged.
create or replace function jfl.create_season_setup(
  actor_user_id uuid,
  configured_season_name text,
  configured_league_night text,
  configured_first_round_date date,
  configured_roster_lock_round integer,
  configured_opening_block_length integer,
  configured_individual_min_matches integer,
  configured_round_interval_days integer,
  configured_table_numbers integer[],
  configured_race_chart_version text,
  configured_playoff_team_count integer,
  configured_playoff_anchor_tiebreaker boolean,
  configured_purpose text default 'league'
)
returns table(
  id uuid,
  name text,
  status text,
  league_night text,
  first_round_date date,
  roster_lock_round integer,
  opening_block_length integer,
  individual_min_matches integer,
  round_interval_days integer,
  default_table_numbers integer[],
  race_chart_version text,
  playoff_team_count integer,
  playoff_anchor_tiebreaker boolean,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  created_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (select 1 from jfl_private.league_admins la where la.user_id=actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if configured_purpose is null or configured_purpose not in ('league','qa') then raise exception 'Invalid season purpose'; end if;
  -- Insert a distinct registration season first; the existing explicit-target validator/configurator
  -- owns all setup rules and audit. Any failed validation rolls back this insert.
  insert into jfl.seasons(name,status,purpose) values(configured_season_name,'registration',configured_purpose)
    returning seasons.id into created_id;
  return query select * from jfl.configure_season_setup(
    actor_user_id,created_id,configured_season_name,configured_league_night,
    configured_first_round_date,configured_roster_lock_round,configured_opening_block_length,
    configured_individual_min_matches,configured_round_interval_days,configured_table_numbers,
    configured_race_chart_version,configured_playoff_team_count,configured_playoff_anchor_tiebreaker);
end;
$function$;
revoke all on function jfl.create_season_setup(uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean,text) from public, anon, authenticated;
grant execute on function jfl.create_season_setup(uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean,text) to service_role;
notify pgrst, 'reload schema';
