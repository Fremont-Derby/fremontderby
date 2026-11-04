-- Tracks #3301. Run only against oqkkvqkerusepyokzbmt / jfl after migration.
-- Uses only the established synthetic two-captain QA identities. All writes
-- (preferences, conversation, message, read, block, report) roll back together.
begin;
set local role service_role;
do $$
declare
  user_a constant uuid := '18580000-0000-4000-8000-000000000002';
  user_b constant uuid := '18580000-0000-4000-8000-000000000003';
  season constant uuid := '18580000-1000-4000-8000-000000000000';
  player_a uuid; player_b uuid; thread_id uuid; test_message_id uuid; replay_id uuid;
  client_id uuid := gen_random_uuid(); prior_read timestamptz;
begin
  if not exists(select 1 from jfl.seasons where id=season and purpose='qa') then
    raise exception 'Exact synthetic QA season required';
  end if;
  select id into strict player_a from jfl.players where user_id=user_a;
  select id into strict player_b from jfl.players where user_id=user_b;
  if jfl.get_direct_message_consent(gen_random_uuid()) then raise exception 'Missing preference must be OFF'; end if;
  perform jfl.set_direct_message_consent(user_a,false);
  perform jfl.set_direct_message_consent(user_b,false);
  begin
    perform jfl.start_direct_conversation(user_a,season,player_b);
    raise exception 'OFF/OFF initiation allowed';
  exception when insufficient_privilege then null;
  end;
  perform jfl.set_direct_message_consent(user_a,true);
  begin
    perform jfl.start_direct_conversation(user_a,season,player_b);
    raise exception 'ON/OFF initiation allowed';
  exception when insufficient_privilege then null;
  end;
  perform jfl.set_direct_message_consent(user_b,true);
  if not jfl.get_direct_message_consent(user_a) or not jfl.get_direct_message_consent(user_b) then
    raise exception 'Preference did not persist';
  end if;
  select conversation_id into strict thread_id from jfl.start_direct_conversation(user_a,season,player_b);
  select s.message_id into strict test_message_id from jfl.send_direct_message(user_a,thread_id,'Synthetic consent regression',client_id) s;
  select s.message_id into strict replay_id from jfl.send_direct_message(user_a,thread_id,'Synthetic consent regression',client_id) s;
  if test_message_id<>replay_id then raise exception 'Idempotence broken'; end if;
  if not exists(select 1 from jfl.list_direct_message_candidates(user_a) where player_id=player_b and season_id=season) then
    raise exception 'ON recipient missing from candidates';
  end if;
  perform jfl.set_direct_message_consent(user_b,false);
  if not jfl.get_direct_message_consent(user_a) then raise exception 'Other consent was changed'; end if;
  begin
    perform jfl.send_direct_message(user_a,thread_id,'Denied stale old-thread send',gen_random_uuid());
    raise exception 'Opt-out old-thread send allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform jfl.start_direct_conversation(user_a,season,player_b);
    raise exception 'Opt-out deep-link initiation allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into jfl.direct_messages(conversation_id,author_player_id,body) values(thread_id,player_a,'Denied direct table write');
    raise exception 'Direct table bypass allowed';
  exception when insufficient_privilege then null;
  end;
  if exists(select 1 from jfl.list_direct_message_candidates(user_a) where player_id=player_b) then
    raise exception 'Opted-out candidate exposed';
  end if;
  if exists(select 1 from jfl.get_my_direct_message_inbox(user_a) where conversation_id=thread_id and can_send) then
    raise exception 'Opt-out inbox sendability allowed';
  end if;
  if not exists(select 1 from jfl.list_direct_messages(user_b,thread_id) s where s.message_id=test_message_id) then
    raise exception 'Participant history lost after opt-out';
  end if;
  select last_read_at into prior_read from jfl.direct_chat_reads where conversation_id=thread_id and player_id=player_b;
  perform jfl.mark_direct_chat_read(user_b,thread_id,now());
  if (select last_read_at from jfl.direct_chat_reads where conversation_id=thread_id and player_id=player_b) is distinct from prior_read then
    raise exception 'Opt-out read activity written';
  end if;
  if exists(select 1 from jfl.get_my_direct_message_inbox(user_b) where conversation_id=thread_id and unread_count<>0) then
    raise exception 'Opt-out unread activity exposed';
  end if;
  perform jfl.block_player_chat(user_b,player_a);
  if not exists(select 1 from jfl.list_blocked_chat_players(user_b) where player_id=player_a) then
    raise exception 'Opt-out block unavailable';
  end if;
  perform jfl.report_chat_message(user_b,'direct',test_message_id,'other','Synthetic consent regression');
  -- Existing moderation update must remain possible while consent is OFF.
  update jfl.direct_messages set removed_at=now(),removed_by=user_b where id=test_message_id;
  if not exists(select 1 from jfl.direct_messages where id=test_message_id and removed_at is not null) then
    raise exception 'Opt-out moderation unavailable';
  end if;
  perform jfl.unblock_player_chat(user_b,player_a);
  perform jfl.set_direct_message_consent(user_a,false);
  perform jfl.set_direct_message_consent(user_b,true);
  begin
    perform jfl.send_direct_message(user_a,thread_id,'Denied opted-out sender',gen_random_uuid());
    raise exception 'Opt-out sender send allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'passed' as rollback_only_direct_message_consent_assertions;
