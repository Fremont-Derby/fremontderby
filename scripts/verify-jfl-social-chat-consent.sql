-- Tracks #3304. Exact established synthetic JFL QA identity only; all writes roll back.
begin;
set local role service_role;
do $test$
declare
  actor constant uuid := '18580000-0000-4000-8000-000000000002';
  peer constant uuid := '18580000-0000-4000-8000-000000000003';
  qa_season constant uuid := '18580000-1000-4000-8000-000000000000';
  actor_player uuid; team uuid; peer_team uuid; test_id uuid; replay_id uuid;
  client_id uuid; before_dm boolean;
begin
  if not exists(select 1 from jfl.seasons where id=qa_season and purpose='qa') then
    raise exception 'Exact synthetic QA season required';
  end if;
  select id into strict actor_player from jfl.players where user_id=actor;
  select team_id into strict team from jfl.team_memberships
    where player_id=actor_player and season_id=qa_season and ends_at is null;
  select tm.team_id into strict peer_team from jfl.team_memberships tm join jfl.players p on p.id=tm.player_id
    where p.user_id=peer and tm.season_id=qa_season and tm.ends_at is null;
  before_dm := jfl.get_direct_message_consent(actor);
  if jfl.get_social_chat_consent(gen_random_uuid(),'team') or jfl.get_social_chat_consent(gen_random_uuid(),'general') then
    raise exception 'Missing preferences not OFF';
  end if;
  perform jfl.set_social_chat_consent(actor,'general',false);
  perform jfl.set_social_chat_consent(actor,'team',false);

  if exists(select 1 from jfl.get_my_team_chat_inbox(actor)) then raise exception 'OFF inbox exposes participation'; end if;
  begin
    perform jfl.send_team_chat_message(actor,team,'Denied OFF send',gen_random_uuid());
    raise exception 'OFF send accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform jfl.list_team_chat_messages(actor,team);
    raise exception 'OFF deep link read accepted';
  exception when insufficient_privilege then null; end;
  perform jfl.set_social_chat_consent(actor,'team',true);
  if not jfl.get_social_chat_consent(actor,'team') then raise exception 'ON did not persist'; end if;
  if jfl.get_social_chat_consent(actor,'general') then raise exception 'Other channel enabled implicitly'; end if;
  if not exists(select 1 from jfl.get_my_team_chat_inbox(actor)) then raise exception 'ON inbox missing'; end if;
  client_id := gen_random_uuid();
  select m.message_id into strict test_id from jfl.send_team_chat_message(actor,team,'Synthetic social consent regression',client_id) m;
  select m.message_id into strict replay_id from jfl.send_team_chat_message(actor,team,'Synthetic social consent regression',client_id) m;
  if test_id<>replay_id then raise exception 'Idempotence broken'; end if;
  if not exists(select 1 from jfl.list_team_chat_messages(actor,team) m where m.message_id=test_id) then raise exception 'ON history missing'; end if;
  perform jfl.mark_team_chat_read(actor,team,now());
  perform jfl.set_social_chat_consent(actor,'team',false);
  begin
    perform jfl.send_team_chat_message(actor,team,'Denied stale send',gen_random_uuid());
    raise exception 'Opt-out stale send accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into jfl.team_chat_messages(season_id,team_id,author_player_id,body)
      values(qa_season,team,actor_player,'Denied storage bypass');
    raise exception 'OFF storage insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    update jfl.team_chat_messages set body='Denied storage edit' where id=test_id;
    raise exception 'OFF storage content update accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform jfl.mark_team_chat_read(actor,team,now());
    raise exception 'OFF read activity accepted';
  exception when insufficient_privilege then null; end;
  begin
    update jfl.team_chat_reads set last_read_at=now() where player_id=actor_player and team_id=team;
    raise exception 'OFF direct read activity accepted';
  exception when insufficient_privilege then null; end;
  update jfl.team_chat_messages set removed_at=now(),removed_by=actor where id=test_id;
  if not exists(select 1 from jfl.team_chat_messages where id=test_id and removed_at is not null) then raise exception 'OFF moderation removal failed'; end if;

  if exists(select 1 from jfl.get_my_league_chat_inbox(actor)) then raise exception 'OFF inbox exposes participation'; end if;
  begin
    perform jfl.send_league_chat_message(actor,qa_season,'Denied OFF send',gen_random_uuid());
    raise exception 'OFF send accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform jfl.list_league_chat_messages(actor,qa_season);
    raise exception 'OFF deep link read accepted';
  exception when insufficient_privilege then null; end;
  perform jfl.set_social_chat_consent(actor,'general',true);
  if not jfl.get_social_chat_consent(actor,'general') then raise exception 'ON did not persist'; end if;
  if jfl.get_social_chat_consent(actor,'team') then raise exception 'Other channel enabled implicitly'; end if;
  if not exists(select 1 from jfl.get_my_league_chat_inbox(actor)) then raise exception 'ON inbox missing'; end if;
  client_id := gen_random_uuid();
  select m.message_id into strict test_id from jfl.send_league_chat_message(actor,qa_season,'Synthetic social consent regression',client_id) m;
  select m.message_id into strict replay_id from jfl.send_league_chat_message(actor,qa_season,'Synthetic social consent regression',client_id) m;
  if test_id<>replay_id then raise exception 'Idempotence broken'; end if;
  if not exists(select 1 from jfl.list_league_chat_messages(actor,qa_season) m where m.message_id=test_id) then raise exception 'ON history missing'; end if;
  perform jfl.mark_league_chat_read(actor,qa_season,now());
  perform jfl.set_social_chat_consent(actor,'general',false);
  begin
    perform jfl.send_league_chat_message(actor,qa_season,'Denied stale send',gen_random_uuid());
    raise exception 'Opt-out stale send accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into jfl.league_chat_messages(season_id,author_player_id,body)
      values(qa_season,actor_player,'Denied storage bypass');
    raise exception 'OFF storage insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    update jfl.league_chat_messages set body='Denied storage edit' where id=test_id;
    raise exception 'OFF storage content update accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform jfl.mark_league_chat_read(actor,qa_season,now());
    raise exception 'OFF read activity accepted';
  exception when insufficient_privilege then null; end;
  begin
    update jfl.league_chat_reads set last_read_at=now() where player_id=actor_player and season_id=qa_season;
    raise exception 'OFF direct read activity accepted';
  exception when insufficient_privilege then null; end;
  update jfl.league_chat_messages set removed_at=now(),removed_by=actor where id=test_id;
  if not exists(select 1 from jfl.league_chat_messages where id=test_id and removed_at is not null) then raise exception 'OFF moderation removal failed'; end if;

  perform jfl.set_social_chat_consent(actor,'team',true);
  begin
    perform jfl.send_team_chat_message(actor,peer_team,'Denied other team',gen_random_uuid());
    raise exception 'Other team access allowed';
  exception when raise_exception then
    if SQLERRM <> 'Active team membership is required to post messages' then raise; end if;
  end;
  perform jfl.set_social_chat_consent(actor,'general',true);
  perform jfl.set_social_chat_consent(actor,'team',false);
  if not jfl.get_social_chat_consent(actor,'general') then raise exception 'Disabling Team changed General'; end if;
  if jfl.get_direct_message_consent(actor) is distinct from before_dm then raise exception 'Social preference changed DM'; end if;
  if has_table_privilege('authenticated','jfl.social_chat_consent','SELECT')
    or has_table_privilege('anon','jfl.social_chat_consent','INSERT')
    or has_function_privilege('authenticated','jfl.set_social_chat_consent(uuid,text,boolean)','EXECUTE') then
    raise exception 'Browser consent privilege leak';
  end if;
end;
$test$;
rollback;
select 'passed' as rollback_only_social_chat_consent_assertions;
