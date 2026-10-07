-- #3307: Aggregate-only proof, all attempted writes roll back.
begin;
set local role service_role;
do $test$
declare
  actor constant uuid := '18580000-0000-4000-8000-000000000002';
  peer constant uuid := '18580000-0000-4000-8000-000000000003';
  season constant uuid := '18580000-1000-4000-8000-000000000000';
  target uuid := gen_random_uuid();
  team uuid; peer_team uuid; round_id uuid; player_match uuid; actor_player uuid; peer_player uuid;
begin
  if not exists(select 1 from jfl.seasons where id=season and purpose='qa') then
    raise exception 'Exact synthetic QA season required';
  end if;
  select tm.team_id into strict team from jfl.team_memberships tm join jfl.players p on p.id=tm.player_id
    where p.user_id=actor and tm.season_id=season and tm.role='captain' and tm.ends_at is null;
  select tm.team_id into strict peer_team from jfl.team_memberships tm join jfl.players p on p.id=tm.player_id
    where p.user_id=peer and tm.season_id=season and tm.role='captain' and tm.ends_at is null;
  select p.id into strict actor_player from jfl.players p where p.user_id=actor;
  select p.id into strict peer_player from jfl.players p where p.user_id=peer;
  select m.id,m.round_id into strict target,round_id from jfl.team_matches m
    where m.season_id=season and (m.team_a_id=team or m.team_b_id=team) order by m.id limit 1;
  perform jfl.set_social_chat_consent(actor,'general',false);
  perform jfl.set_social_chat_consent(actor,'team',false);
  perform jfl.set_direct_message_consent(actor,false);
  perform jfl.set_social_chat_consent(peer,'general',false);
  perform jfl.set_social_chat_consent(peer,'team',false);
  perform jfl.set_direct_message_consent(peer,false);
  if jfl.get_social_chat_consent(actor,'general') or jfl.get_social_chat_consent(actor,'team')
    or jfl.get_direct_message_consent(actor) then raise exception 'All three channels must be OFF'; end if;
  -- Required structured operations do not depend on social preferences.
  if not exists(select 1 from jfl.set_roster_availability(actor,round_id,'available')) then
    raise exception 'OFF availability write failed';
  end if;
  perform * from jfl.list_team_round_availability(actor,team,round_id);
  perform * from jfl.list_visible_team_lineups(actor,team,round_id);
  if exists(select 1 from jfl_private.team_lineups tl where tl.team_match_id=target) then
    raise exception 'Clean synthetic QA match required; do not reset or replace peer work';
  end if;
  perform * from jfl.submit_team_lineup(actor,team,round_id,
    jsonb_build_array(jsonb_build_object('slotNumber',1,'playerId',actor_player)));
  perform * from jfl.submit_team_lineup(peer,peer_team,round_id,
    jsonb_build_array(jsonb_build_object('slotNumber',1,'playerId',peer_player)));
  select pm.id into strict player_match from jfl.player_matches pm
    where pm.season_id=season and (pm.team_a_id=team or pm.team_b_id=team) order by pm.id limit 1;
  if not exists(select 1 from jfl.get_player_match_scorecard(actor,player_match)) then
    raise exception 'OFF scorecard access failed';
  end if;
  if not exists(select 1 from jfl.record_player_match_rack(actor,player_match,'A')) then
    raise exception 'OFF rack scoring failed';
  end if;
  perform * from jfl.undo_player_match_rack(actor,player_match);
  perform * from jfl.list_my_notifications(actor,50);
  perform * from jfl.mark_all_my_notifications_read(actor);
  if exists(select 1 from jfl.get_my_matchup_chat_inbox(actor)) then
    raise exception 'Retired inbox returned a thread';
  end if;
  begin
    perform jfl.send_matchup_chat_message(actor,target,'Denied synthetic stale send',gen_random_uuid());
    raise exception 'Retired send RPC accepted';
  exception when insufficient_privilege then
    if SQLERRM <> 'Matchup chat is retired' then raise; end if;
  end;
  begin
    perform jfl.mark_matchup_chat_read(actor,target,now());
    raise exception 'Retired read RPC accepted';
  exception when insufficient_privilege then
    if SQLERRM <> 'Matchup chat is retired' then raise; end if;
  end;
  begin
    insert into jfl.matchup_chat_messages(team_match_id,author_player_id,author_team_id,body)
      values(target,actor,gen_random_uuid(),'Denied direct storage send');
    raise exception 'Direct storage send accepted';
  exception when insufficient_privilege then
    if SQLERRM <> 'Matchup chat is retired' then raise; end if;
  end;
  begin
    insert into jfl.matchup_chat_reads(team_match_id,player_id,last_read_at) values(target,actor,now());
    raise exception 'Direct storage read activity accepted';
  exception when insufficient_privilege then
    if SQLERRM <> 'Matchup chat is retired' then raise; end if;
  end;
  if has_function_privilege('authenticated','jfl.send_matchup_chat_message(uuid,uuid,text,uuid)','EXECUTE')
    or has_table_privilege('authenticated','jfl.matchup_chat_messages','INSERT')
    or has_function_privilege('anon','jfl.enforce_matchup_chat_retirement()','EXECUTE') then
    raise exception 'Browser storage privilege leak';
  end if;
end;
$test$;
rollback;
select 'passed' as rollback_only_matchup_chat_retirement_assertions;
