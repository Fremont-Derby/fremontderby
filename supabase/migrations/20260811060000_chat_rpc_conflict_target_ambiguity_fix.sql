-- PL/pgSQL output columns are variables. Use named constraints so conflict
-- targets cannot collide with RETURNS TABLE column names at runtime.

create or replace function public.send_team_chat_message(
  actor_user_id uuid,
  target_team_id uuid,
  message_body text,
  message_client_id uuid default null
)
returns table (
  message_id uuid,
  team_id uuid,
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
  target_team public.teams%rowtype;
  saved_message public.team_chat_messages%rowtype;
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

  select t.* into target_team
  from public.teams t
  where t.id = target_team_id;
  if target_team.id is null then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player.id
      and tm.ends_at is null
  ) then
    raise exception 'Active team membership is required to post messages';
  end if;

  insert into public.team_chat_messages (
    season_id, team_id, author_player_id, client_message_id, body
  ) values (
    target_team.season_id, target_team.id, actor_player.id,
    message_client_id, message_body
  )
  on conflict on constraint team_chat_messages_author_player_id_client_message_id_key
  do update set client_message_id = excluded.client_message_id
  returning * into saved_message;

  return query select saved_message.id, saved_message.team_id,
    saved_message.author_player_id, actor_player.display_name,
    saved_message.body, saved_message.created_at, true;
end;
$$;

create or replace function public.mark_team_chat_read(
  actor_user_id uuid,
  target_team_id uuid,
  read_through_at timestamptz default null
)
returns table (team_id uuid, player_id uuid, last_read_at timestamptz)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  effective_read_at timestamptz := least(coalesce(read_through_at, now()), now());
begin
  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select tm.season_id into target_season_id
  from public.team_memberships tm
  where tm.team_id = target_team_id
    and tm.player_id = actor_player_id
    and tm.ends_at is null;
  if target_season_id is null then
    raise exception 'Active team membership is required to mark chat read';
  end if;

  insert into public.team_chat_reads (season_id, team_id, player_id, last_read_at)
  values (target_season_id, target_team_id, actor_player_id, effective_read_at)
  on conflict on constraint team_chat_reads_pkey
  do update set last_read_at = greatest(
    public.team_chat_reads.last_read_at,
    excluded.last_read_at
  );

  return query
  select read_state.team_id, read_state.player_id, read_state.last_read_at
  from public.team_chat_reads read_state
  where read_state.team_id = target_team_id
    and read_state.player_id = actor_player_id;
end;
$$;

create or replace function public.start_direct_conversation(
  actor_user_id uuid,
  target_season_id uuid,
  target_player_id uuid
)
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
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player public.players%rowtype;
  target_player public.players%rowtype;
  saved_conversation public.direct_conversations%rowtype;
begin
  select p.* into actor_player
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select p.* into target_player
  from public.players p
  where p.id = target_player_id;
  if target_player.id is null then raise exception 'Player not found'; end if;
  if target_player.id = actor_player.id then
    raise exception 'Cannot message yourself';
  end if;

  if not private.is_active_season_participant(actor_player.id, target_season_id)
    or not private.is_active_season_participant(target_player.id, target_season_id)
  then
    raise exception 'Both players must participate in the active season';
  end if;

  if exists (
    select 1
    from public.player_chat_blocks block
    where (
      block.blocker_player_id = actor_player.id
      and block.blocked_player_id = target_player.id
    ) or (
      block.blocker_player_id = target_player.id
      and block.blocked_player_id = actor_player.id
    )
  ) then
    raise exception 'Direct messages are blocked';
  end if;

  insert into public.direct_conversations (
    season_id, player_low_id, player_high_id, created_by_player_id
  ) values (
    target_season_id,
    least(actor_player.id, target_player.id),
    greatest(actor_player.id, target_player.id),
    actor_player.id
  )
  on conflict on constraint direct_conversations_season_id_player_low_id_player_high_id_key
  do update set season_id = excluded.season_id
  returning * into saved_conversation;

  return query
  select saved_conversation.id, saved_conversation.season_id, season.name,
    target_player.id, target_player.display_name, null::text, null::timestamptz,
    0::bigint, true, false
  from public.seasons season
  where season.id = saved_conversation.season_id;
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
  on conflict on constraint direct_messages_author_player_id_client_message_id_key
  do update set client_message_id = excluded.client_message_id
  returning * into saved_message;

  return query select saved_message.id, saved_message.conversation_id,
    saved_message.author_player_id, actor_player.display_name,
    saved_message.body, saved_message.created_at, true;
end;
$$;

create or replace function public.mark_direct_chat_read(
  actor_user_id uuid,
  target_conversation_id uuid,
  read_through_at timestamptz default null
)
returns table (conversation_id uuid, player_id uuid, last_read_at timestamptz)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
  effective_read_at timestamptz := least(coalesce(read_through_at, now()), now());
begin
  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  if not exists (
    select 1
    from public.direct_conversations conversation
    where conversation.id = target_conversation_id
      and actor_player_id in (conversation.player_low_id, conversation.player_high_id)
  ) then
    raise exception 'Direct conversation not found';
  end if;

  insert into public.direct_chat_reads (conversation_id, player_id, last_read_at)
  values (target_conversation_id, actor_player_id, effective_read_at)
  on conflict on constraint direct_chat_reads_pkey
  do update set last_read_at = greatest(
    public.direct_chat_reads.last_read_at,
    excluded.last_read_at
  );

  return query
  select read_state.conversation_id, read_state.player_id, read_state.last_read_at
  from public.direct_chat_reads read_state
  where read_state.conversation_id = target_conversation_id
    and read_state.player_id = actor_player_id;
end;
$$;

create or replace function public.block_player_chat(
  actor_user_id uuid,
  target_player_id uuid
)
returns table (
  blocked_player_id uuid,
  blocked_display_name text,
  blocked_at timestamptz
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_player public.players%rowtype;
  saved_block public.player_chat_blocks%rowtype;
begin
  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select p.* into target_player
  from public.players p
  where p.id = target_player_id;
  if target_player.id is null then raise exception 'Player not found'; end if;
  if target_player.id = actor_player_id then raise exception 'Cannot block yourself'; end if;

  insert into public.player_chat_blocks (blocker_player_id, blocked_player_id)
  values (actor_player_id, target_player.id)
  on conflict on constraint player_chat_blocks_pkey
  do update set blocker_player_id = excluded.blocker_player_id
  returning * into saved_block;

  return query
  select saved_block.blocked_player_id, target_player.display_name, saved_block.created_at;
end;
$$;

create or replace function public.send_league_chat_message(
  actor_user_id uuid,
  target_season_id uuid,
  message_body text,
  message_client_id uuid default null
)
returns table (
  message_id uuid,
  season_id uuid,
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
  saved_message public.league_chat_messages%rowtype;
begin
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(message_body) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;
  select player.* into actor_player
  from public.players player
  where player.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not private.is_active_season_participant(actor_player.id, target_season_id) then
    raise exception 'Active season participation is required to post league messages';
  end if;

  insert into public.league_chat_messages (
    season_id, author_player_id, client_message_id, body
  ) values (
    target_season_id, actor_player.id, message_client_id, message_body
  )
  on conflict on constraint league_chat_messages_author_client_key
  do update set client_message_id = excluded.client_message_id
  returning * into saved_message;

  return query select saved_message.id, saved_message.season_id,
    saved_message.author_player_id, actor_player.display_name,
    saved_message.body, saved_message.created_at, true;
end;
$$;

create or replace function public.mark_league_chat_read(
  actor_user_id uuid,
  target_season_id uuid,
  read_through_at timestamptz default null
)
returns table (season_id uuid, player_id uuid, last_read_at timestamptz)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  select player.id into actor_player_id
  from public.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not private.is_season_chat_participant(actor_player_id, target_season_id) then
    raise exception 'League chat access is required';
  end if;

  return query
  insert into public.league_chat_reads (season_id, player_id, last_read_at)
  values (target_season_id, actor_player_id, coalesce(read_through_at, clock_timestamp()))
  on conflict on constraint league_chat_reads_pkey
  do update set
    last_read_at = greatest(public.league_chat_reads.last_read_at, excluded.last_read_at),
    updated_at = clock_timestamp()
  returning public.league_chat_reads.season_id,
    public.league_chat_reads.player_id,
    public.league_chat_reads.last_read_at;
end;
$$;

create or replace function public.send_matchup_chat_message(
  actor_user_id uuid,
  target_team_match_id uuid,
  message_body text,
  message_client_id uuid default null
)
returns table (
  message_id uuid,
  team_match_id uuid,
  author_player_id uuid,
  author_display_name text,
  author_team_name text,
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
  target_match public.team_matches%rowtype;
  actor_team_id uuid;
  actor_team_name text;
  saved_message public.matchup_chat_messages%rowtype;
begin
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(message_body) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;
  select player.* into actor_player
  from public.players player
  where player.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  select match.* into target_match
  from public.team_matches match
  where match.id = target_team_match_id;
  if target_match.id is null then raise exception 'Team matchup not found'; end if;
  if target_match.status in ('finalized', 'corrected', 'cancelled') then
    raise exception 'Completed matchup chats are read-only';
  end if;
  if not private.is_active_season_participant(actor_player.id, target_match.season_id) then
    raise exception 'Active season participation is required to post matchup messages';
  end if;

  select membership.team_id, team.name into actor_team_id, actor_team_name
  from public.team_memberships membership
  join public.teams team on team.id = membership.team_id
  where membership.player_id = actor_player.id
    and membership.season_id = target_match.season_id
    and membership.team_id in (target_match.team_a_id, target_match.team_b_id)
    and membership.ends_at is null
  order by membership.starts_at desc
  limit 1;
  if actor_team_id is null then
    raise exception 'Current matchup team membership is required';
  end if;

  insert into public.matchup_chat_messages (
    team_match_id, author_player_id, author_team_id, client_message_id, body
  ) values (
    target_match.id, actor_player.id, actor_team_id, message_client_id, message_body
  )
  on conflict on constraint matchup_chat_messages_author_player_id_client_message_id_key
  do update set client_message_id = excluded.client_message_id
  returning * into saved_message;

  return query select saved_message.id, saved_message.team_match_id,
    saved_message.author_player_id, actor_player.display_name, actor_team_name,
    saved_message.body, saved_message.created_at, true;
end;
$$;

create or replace function public.mark_matchup_chat_read(
  actor_user_id uuid,
  target_team_match_id uuid,
  read_through_at timestamptz default null
)
returns table (team_match_id uuid, player_id uuid, last_read_at timestamptz)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  select player.id into actor_player_id
  from public.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not exists (
    select 1
    from public.team_matches match
    join public.team_memberships membership
      on membership.season_id = match.season_id
      and membership.team_id in (match.team_a_id, match.team_b_id)
      and membership.player_id = actor_player_id
    where match.id = target_team_match_id
  ) then
    raise exception 'Matchup chat access is required';
  end if;

  return query
  insert into public.matchup_chat_reads (team_match_id, player_id, last_read_at)
  values (target_team_match_id, actor_player_id, coalesce(read_through_at, clock_timestamp()))
  on conflict on constraint matchup_chat_reads_pkey
  do update set
    last_read_at = greatest(public.matchup_chat_reads.last_read_at, excluded.last_read_at),
    updated_at = clock_timestamp()
  returning public.matchup_chat_reads.team_match_id,
    public.matchup_chat_reads.player_id,
    public.matchup_chat_reads.last_read_at;
end;
$$;

revoke all on function public.send_team_chat_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_team_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.start_direct_conversation(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.send_direct_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_direct_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.block_player_chat(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.send_league_chat_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_league_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.send_matchup_chat_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_matchup_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.send_team_chat_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_team_chat_read(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.start_direct_conversation(uuid, uuid, uuid)
  to service_role;
grant execute on function public.send_direct_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_direct_chat_read(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.block_player_chat(uuid, uuid)
  to service_role;
grant execute on function public.send_league_chat_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_league_chat_read(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.send_matchup_chat_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_matchup_chat_read(uuid, uuid, timestamptz)
  to service_role;
