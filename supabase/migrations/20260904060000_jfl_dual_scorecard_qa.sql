-- JFL-only QA support for validating both scoring teams against the same live scorecard.
-- Existing test personas remain isolated from production/gamma; this migration only touches the jfl schemas.

do $$
declare
  target_season_id uuid;
  bank_shots_id uuid;
  table_testers_id uuid;
  admin_persona_player_id uuid;
  regular_persona_player_id uuid;
begin
  select tm.season_id, tm.team_a_id, tm.team_b_id
    into target_season_id, bank_shots_id, table_testers_id
  from jfl.team_matches tm
  join jfl.teams a on a.id = tm.team_a_id
  join jfl.teams b on b.id = tm.team_b_id
  where a.name = 'JFL QA Bank Shots'
    and b.name = 'JFL QA Table Testers'
  order by tm.created_at desc
  limit 1;

  if target_season_id is null then
    raise exception 'JFL dual-scorecard QA matchup not found';
  end if;

  select p.id into admin_persona_player_id
  from jfl.players p
  where p.user_id = '18580000-0000-4000-8000-000000000002'::uuid
  limit 1;

  select p.id into regular_persona_player_id
  from jfl.players p
  where p.user_id = '18580000-0000-4000-8000-000000000003'::uuid
  limit 1;

  if admin_persona_player_id is null or regular_persona_player_id is null then
    raise exception 'Required JFL test persona players are missing';
  end if;

  if not exists (
    select 1 from jfl.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = admin_persona_player_id
      and tm.team_id = bank_shots_id
      and tm.ends_at is null
  ) then
    insert into jfl.team_memberships (id, season_id, team_id, player_id, role, starts_at)
    values (gen_random_uuid(), target_season_id, bank_shots_id, admin_persona_player_id, 'player', now());
  end if;

  if not exists (
    select 1 from jfl.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = regular_persona_player_id
      and tm.team_id = table_testers_id
      and tm.ends_at is null
  ) then
    insert into jfl.team_memberships (id, season_id, team_id, player_id, role, starts_at)
    values (gen_random_uuid(), target_season_id, table_testers_id, regular_persona_player_id, 'player', now());
  end if;
end $$;

create or replace function jfl.reset_dual_scorecard_qa()
returns table(team_match_id uuid, reset_player_matches integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_team_match_id uuid;
  affected integer := 0;
begin
  select tm.id into target_team_match_id
  from jfl.team_matches tm
  join jfl.teams a on a.id = tm.team_a_id
  join jfl.teams b on b.id = tm.team_b_id
  where a.name = 'JFL QA Bank Shots'
    and b.name = 'JFL QA Table Testers'
  order by tm.created_at desc
  limit 1;

  if target_team_match_id is null then
    raise exception 'JFL dual-scorecard QA matchup not found';
  end if;

  delete from jfl_private.player_match_score_submissions s
  using jfl.player_matches pm
  where pm.team_match_id = target_team_match_id
    and s.player_match_id = pm.id;

  delete from jfl.player_match_racks r
  using jfl.player_matches pm
  where pm.team_match_id = target_team_match_id
    and r.player_match_id = pm.id;

  update jfl.player_matches pm
  set status = 'scheduled',
      winner_player_id = null,
      current_discipline = pm.opening_discipline,
      score_a = 0,
      score_b = 0,
      winner_side = null,
      finalized_at = null,
      finalized_by = null,
      corrected_at = null,
      corrected_by = null,
      correction_reason = null
  where pm.team_match_id = target_team_match_id;
  get diagnostics affected = row_count;

  update jfl.team_matches tm
  set status = 'in_progress',
      winner_team_id = null
  where tm.id = target_team_match_id;

  return query select target_team_match_id, affected;
end;
$$;

revoke all on function jfl.reset_dual_scorecard_qa() from public;
revoke all on function jfl.reset_dual_scorecard_qa() from anon;
revoke all on function jfl.reset_dual_scorecard_qa() from authenticated;
grant execute on function jfl.reset_dual_scorecard_qa() to service_role;
