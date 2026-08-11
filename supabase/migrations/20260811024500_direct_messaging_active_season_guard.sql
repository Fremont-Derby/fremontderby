-- Preserve completed-season direct message history while making it read-only.

create or replace function public.get_my_direct_message_inbox(actor_user_id uuid)
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
declare
  actor_player_id uuid;
begin
  select p.id into actor_player_id
  from public.players p
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
    count(unread.id)::bigint,
    private.is_active_season_participant(actor_player_id, conversation.season_id)
      and private.is_active_season_participant(other_player.id, conversation.season_id)
      and not exists (
        select 1
        from public.player_chat_blocks block
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
      from public.player_chat_blocks block
      where block.blocker_player_id = actor_player_id
        and block.blocked_player_id = other_player.id
    )
  from public.direct_conversations conversation
  join public.seasons season on season.id = conversation.season_id
  join public.players other_player on other_player.id = case
    when conversation.player_low_id = actor_player_id
      then conversation.player_high_id
    else conversation.player_low_id
  end
  left join public.direct_chat_reads read_state
    on read_state.conversation_id = conversation.id
    and read_state.player_id = actor_player_id
  left join lateral (
    select message.body, message.created_at
    from public.direct_messages message
    where message.conversation_id = conversation.id
      and message.removed_at is null
    order by message.created_at desc, message.id desc
    limit 1
  ) latest on true
  left join public.direct_messages unread
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

create or replace function public.send_direct_message(
  actor_user_id uuid,
  target_conversation_id uuid,
  message_body text,
  message_client_id uuid default null
)
returns table (
  message_id uuid,
  conversation_id uuid,
  author_player_id uuid,
  author_display_name text,
  body text,
  created_at timestamptz,
  is_own boolean
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player public.players%rowtype;
  conversation public.direct_conversations%rowtype;
  other_player_id uuid;
  saved_message public.direct_messages%rowtype;
begin
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(message_body) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;

  select p.* into actor_player
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select target.* into conversation
  from public.direct_conversations target
  where target.id = target_conversation_id
    and actor_player.id in (target.player_low_id, target.player_high_id);
  if conversation.id is null then
    raise exception 'Direct conversation not found';
  end if;

  other_player_id := case
    when conversation.player_low_id = actor_player.id
      then conversation.player_high_id
    else conversation.player_low_id
  end;

  if not private.is_active_season_participant(actor_player.id, conversation.season_id)
    or not private.is_active_season_participant(other_player_id, conversation.season_id)
  then
    raise exception 'Both players must participate in the active season';
  end if;

  if exists (
    select 1
    from public.player_chat_blocks block
    where (
      block.blocker_player_id = actor_player.id
      and block.blocked_player_id = other_player_id
    ) or (
      block.blocker_player_id = other_player_id
      and block.blocked_player_id = actor_player.id
    )
  ) then
    raise exception 'Direct messages are blocked';
  end if;

  insert into public.direct_messages (
    conversation_id, author_player_id, client_message_id, body
  ) values (
    conversation.id, actor_player.id, message_client_id, message_body
  )
  on conflict (author_player_id, client_message_id)
  do update set client_message_id = excluded.client_message_id
  returning * into saved_message;

  return query select saved_message.id, saved_message.conversation_id,
    saved_message.author_player_id, actor_player.display_name,
    saved_message.body, saved_message.created_at, true;
end;
$$;

revoke all on function public.get_my_direct_message_inbox(uuid) from public, anon, authenticated;
revoke all on function public.send_direct_message(uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_my_direct_message_inbox(uuid) to service_role;
grant execute on function public.send_direct_message(uuid, uuid, text, uuid) to service_role;
