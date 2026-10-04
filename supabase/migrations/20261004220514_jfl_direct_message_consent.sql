-- Tracks #3301 / #3295. JFL-only; existing accounts are OFF unless explicitly set.
-- Preserve existing RPC authorization/history/moderation; gate writes at storage.
begin;
do $$
begin
  if current_database() <> 'postgres' or to_regnamespace('jfl_private') is null
    or to_regclass('jfl.direct_messages') is null then
    raise exception 'Expected JFL database boundary not found';
  end if;
  if not exists (select 1 from pg_proc where oid='jfl.get_my_direct_message_inbox(uuid)'::regprocedure
    and not prosecdef and md5(pg_get_functiondef(oid))='22b0ce1ae4462372e0018e67d41a47a5')
    or not exists (select 1 from pg_proc where oid='jfl.list_direct_message_candidates(uuid)'::regprocedure
    and not prosecdef and md5(pg_get_functiondef(oid))='cb76adc65098b3084555bac3618afa8c') then
    raise exception 'Direct-message source drift: reconcile before apply';
  end if;
end;
$$;

create table jfl.direct_message_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false
);
alter table jfl.direct_message_consent enable row level security;
create policy "Browser roles cannot access direct message consent"
on jfl.direct_message_consent for all to anon, authenticated using (false) with check (false);
revoke all on jfl.direct_message_consent from public, anon, authenticated;
grant select, insert, update on jfl.direct_message_consent to service_role;

create function jfl_private.direct_messages_enabled(target_user_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce((select enabled from jfl.direct_message_consent where user_id=target_user_id), false);
$$;

-- The same per-account transaction lock is used for preference changes and
-- sends, including an absent preference row. Stable sorted pair order prevents
-- opposing senders from taking these locks in opposite order.
create function jfl_private.lock_direct_message_consent(target_user_id uuid)
returns boolean language plpgsql volatile security invoker set search_path = '' as $$
declare current_enabled boolean;
begin
  if target_user_id is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('jfl:dm:' || target_user_id::text, 0));
  select enabled into current_enabled from jfl.direct_message_consent
    where user_id=target_user_id for update;
  return coalesce(current_enabled, false);
end;
$$;

create function jfl_private.lock_direct_message_preference_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP='UPDATE' and new.user_id <> old.user_id then
    raise exception 'Preference owner cannot change' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('jfl:dm:' || new.user_id::text, 0));
  return new;
end;
$$;
create trigger direct_message_preference_lock before insert or update on jfl.direct_message_consent
for each row execute function jfl_private.lock_direct_message_preference_write();

create function jfl.get_direct_message_consent(actor_user_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select jfl_private.direct_messages_enabled(actor_user_id);
$$;

create function jfl.set_direct_message_consent(actor_user_id uuid, enabled boolean)
returns boolean language plpgsql volatile security invoker set search_path = '' as $$
begin
  if actor_user_id is null or enabled is null then raise exception 'Explicit account and boolean required'; end if;
  perform jfl_private.lock_direct_message_consent(actor_user_id);
  insert into jfl.direct_message_consent(user_id, enabled) values(actor_user_id, enabled)
    on conflict on constraint direct_message_consent_pkey do update set enabled=excluded.enabled;
  return enabled;
end;
$$;

create function jfl_private.require_direct_message_pair(player_a uuid, player_b uuid)
returns void language plpgsql volatile security invoker set search_path = '' as $$
declare user_a uuid; user_b uuid; low_enabled boolean; high_enabled boolean;
begin
  select user_id into user_a from jfl.players where id=player_a;
  select user_id into user_b from jfl.players where id=player_b;
  if user_a is null or user_b is null then
    raise exception 'Direct messaging unavailable' using errcode='42501';
  end if;
  low_enabled := jfl_private.lock_direct_message_consent(least(user_a,user_b));
  high_enabled := jfl_private.lock_direct_message_consent(greatest(user_a,user_b));
  if not low_enabled or not high_enabled then
    raise exception 'Direct messaging unavailable' using errcode='42501';
  end if;
end;
$$;

create function jfl_private.enforce_direct_conversation_consent()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform jfl_private.require_direct_message_pair(new.player_low_id,new.player_high_id);
  return new;
end;
$$;
create trigger direct_conversation_consent before insert or update of season_id,player_low_id,player_high_id
on jfl.direct_conversations for each row execute function jfl_private.enforce_direct_conversation_consent();

create function jfl_private.enforce_direct_message_consent()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare conversation jfl.direct_conversations%rowtype;
begin
  select * into conversation from jfl.direct_conversations where id=new.conversation_id;
  if conversation.id is null or new.author_player_id not in (conversation.player_low_id,conversation.player_high_id) then
    raise exception 'Direct messaging unavailable' using errcode='42501';
  end if;
  perform jfl_private.require_direct_message_pair(conversation.player_low_id,conversation.player_high_id);
  return new;
end;
$$;
-- Moderation can remove a message without either participant opting back in.
create trigger direct_message_consent before insert or update of conversation_id,author_player_id,body,client_message_id
on jfl.direct_messages for each row execute function jfl_private.enforce_direct_message_consent();

create function jfl_private.enforce_direct_read_consent()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare reader_user_id uuid;
begin
  select user_id into reader_user_id from jfl.players where id=new.player_id;
  if not jfl_private.lock_direct_message_consent(reader_user_id) then return null; end if;
  return new;
end;
$$;
create trigger direct_read_consent before insert or update on jfl.direct_chat_reads
for each row execute function jfl_private.enforce_direct_read_consent();

-- Only the Worker service path can supply actor IDs. No new browser RPC grant.
revoke all on function jfl.get_direct_message_consent(uuid),jfl.set_direct_message_consent(uuid,boolean),
  jfl_private.direct_messages_enabled(uuid),jfl_private.lock_direct_message_consent(uuid),
  jfl_private.require_direct_message_pair(uuid,uuid),jfl_private.lock_direct_message_preference_write(),
  jfl_private.enforce_direct_conversation_consent(),jfl_private.enforce_direct_message_consent(),
  jfl_private.enforce_direct_read_consent() from public,anon,authenticated;
grant execute on function jfl.get_direct_message_consent(uuid),jfl.set_direct_message_consent(uuid,boolean),
  jfl_private.direct_messages_enabled(uuid),jfl_private.lock_direct_message_consent(uuid),
  jfl_private.require_direct_message_pair(uuid,uuid),jfl_private.lock_direct_message_preference_write(),
  jfl_private.enforce_direct_conversation_consent(),jfl_private.enforce_direct_message_consent(),
  jfl_private.enforce_direct_read_consent() to service_role;

create or replace function jfl.list_direct_message_candidates(actor_user_id uuid)
returns table (
  season_id uuid,
  season_name text,
  player_id uuid,
  display_name text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  select p.id into actor_player_id
  from jfl.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  return query
  with participants as (
    select sp.season_id, sp.player_id
    from jfl.season_players sp
    where sp.status = 'active'
    union
    select tm.season_id, tm.player_id
    from jfl.team_memberships tm
    where tm.ends_at is null
  ),
  actor_seasons as (
    select participant.season_id
    from participants participant
    where participant.player_id = actor_player_id
  )
  select s.id, s.name, candidate.id, candidate.display_name
  from actor_seasons actor_season
  join jfl.seasons s on s.id = actor_season.season_id
  join participants participant on participant.season_id = s.id
  join jfl.players candidate on candidate.id = participant.player_id
  where s.status in ('registration', 'active', 'playoffs')
    and candidate.id <> actor_player_id
    and jfl_private.direct_messages_enabled(actor_user_id)
    and jfl_private.direct_messages_enabled(candidate.user_id)
    and not exists (
      select 1
      from jfl.player_chat_blocks block
      where (
        block.blocker_player_id = actor_player_id
        and block.blocked_player_id = candidate.id
      ) or (
        block.blocker_player_id = candidate.id
        and block.blocked_player_id = actor_player_id
      )
    )
  group by s.id, s.name, candidate.id, candidate.display_name
  order by candidate.display_name, s.name;
end;
$$;
create or replace function jfl.get_my_direct_message_inbox(actor_user_id uuid)
returns table (
  conversation_id uuid,
  season_id uuid,
  season_name text,
  other_player_id uuid,
  other_display_name text,
  last_message_body text,
  last_message_at timestamptz,
  unread_count bigint,
  can_send boolean,
  blocked_by_me boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  select p.id into actor_player_id
  from jfl.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  return query
  select
    conversation.id,
    conversation.season_id,
    season.name,
    other_player.id,
    other_player.display_name,
    latest.body,
    latest.created_at,
    case when jfl_private.direct_messages_enabled(actor_user_id) then count(unread.id)::bigint else 0::bigint end,
    jfl_private.direct_messages_enabled(actor_user_id)
      and jfl_private.direct_messages_enabled(other_player.user_id)
      and jfl_private.is_active_season_participant(actor_player_id, conversation.season_id)
      and jfl_private.is_active_season_participant(other_player.id, conversation.season_id)
      and not exists (
        select 1
        from jfl.player_chat_blocks block
        where (
          block.blocker_player_id = actor_player_id
          and block.blocked_player_id = other_player.id
        ) or (
          block.blocker_player_id = other_player.id
          and block.blocked_player_id = actor_player_id
        )
      ),
    exists (
      select 1
      from jfl.player_chat_blocks block
      where block.blocker_player_id = actor_player_id
        and block.blocked_player_id = other_player.id
    )
  from jfl.direct_conversations conversation
  join jfl.seasons season on season.id = conversation.season_id
  join jfl.players other_player on other_player.id = case
    when conversation.player_low_id = actor_player_id
      then conversation.player_high_id
    else conversation.player_low_id
  end
  left join jfl.direct_chat_reads read_state
    on read_state.conversation_id = conversation.id
    and read_state.player_id = actor_player_id
  left join lateral (
    select message.body, message.created_at
    from jfl.direct_messages message
    where message.conversation_id = conversation.id
      and message.removed_at is null
    order by message.created_at desc, message.id desc
    limit 1
  ) latest on true
  left join jfl.direct_messages unread
    on unread.conversation_id = conversation.id
    and unread.created_at > coalesce(read_state.last_read_at, conversation.created_at)
    and unread.author_player_id <> actor_player_id
    and unread.removed_at is null
  where actor_player_id in (conversation.player_low_id, conversation.player_high_id)
  group by conversation.id, conversation.season_id, season.name,
    other_player.id, other_player.display_name, latest.body, latest.created_at
  order by latest.created_at desc nulls last, other_player.display_name;
end;
$$;
notify pgrst, 'reload schema';
commit;
