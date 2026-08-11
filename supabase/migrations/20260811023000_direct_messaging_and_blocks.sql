create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_low_id uuid not null references public.players(id) on delete cascade,
  player_high_id uuid not null references public.players(id) on delete cascade,
  created_by_player_id uuid not null references public.players(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (player_low_id < player_high_id),
  unique (season_id, player_low_id, player_high_id)
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete restrict,
  client_message_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  unique (author_player_id, client_message_id)
);

create table public.direct_chat_reads (
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, player_id)
);

create table public.player_chat_blocks (
  blocker_player_id uuid not null references public.players(id) on delete cascade,
  blocked_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_player_id, blocked_player_id),
  check (blocker_player_id <> blocked_player_id)
);

create index direct_conversations_season_idx
  on public.direct_conversations (season_id);
create index direct_conversations_low_player_idx
  on public.direct_conversations (player_low_id);
create index direct_conversations_high_player_idx
  on public.direct_conversations (player_high_id);
create index direct_conversations_created_by_idx
  on public.direct_conversations (created_by_player_id);
create index direct_messages_conversation_created_idx
  on public.direct_messages (conversation_id, created_at desc, id desc)
  where removed_at is null;
create index direct_messages_author_idx
  on public.direct_messages (author_player_id);
create index direct_messages_removed_by_idx
  on public.direct_messages (removed_by);
create index direct_chat_reads_player_idx
  on public.direct_chat_reads (player_id);
create index player_chat_blocks_blocked_idx
  on public.player_chat_blocks (blocked_player_id, blocker_player_id);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.direct_chat_reads enable row level security;
alter table public.player_chat_blocks enable row level security;

revoke all on
  public.direct_conversations,
  public.direct_messages,
  public.direct_chat_reads,
  public.player_chat_blocks
from public, anon, authenticated;

grant all on
  public.direct_conversations,
  public.direct_messages,
  public.direct_chat_reads,
  public.player_chat_blocks
to service_role;

create policy "Browser roles cannot access direct conversations"
on public.direct_conversations for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access direct messages"
on public.direct_messages for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access direct read state"
on public.direct_chat_reads for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access player blocks"
on public.player_chat_blocks for all to anon, authenticated
using (false) with check (false);

create or replace function private.is_active_season_participant(
  target_player_id uuid,
  target_season_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.seasons s
    where s.id = target_season_id
      and s.status in ('registration', 'active', 'playoffs')
      and (
        exists (
          select 1
          from public.season_players sp
          where sp.season_id = s.id
            and sp.player_id = target_player_id
            and sp.status = 'active'
        )
        or exists (
          select 1
          from public.team_memberships tm
          where tm.season_id = s.id
            and tm.player_id = target_player_id
            and tm.ends_at is null
        )
      )
  );
$$;

revoke all on function private.is_active_season_participant(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.is_active_season_participant(uuid, uuid)
  to service_role;

create or replace function public.list_direct_message_candidates(actor_user_id uuid)
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
  with participants as (
    select sp.season_id, sp.player_id
    from public.season_players sp
    where sp.status = 'active'
    union
    select tm.season_id, tm.player_id
    from public.team_memberships tm
    where tm.ends_at is null
  ),
  actor_seasons as (
    select participant.season_id
    from participants participant
    where participant.player_id = actor_player_id
  )
  select s.id, s.name, candidate.id, candidate.display_name
  from actor_seasons actor_season
  join public.seasons s on s.id = actor_season.season_id
  join participants participant on participant.season_id = s.id
  join public.players candidate on candidate.id = participant.player_id
  where s.status in ('registration', 'active', 'playoffs')
    and candidate.id <> actor_player_id
    and not exists (
      select 1
      from public.player_chat_blocks block
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
    not exists (
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
  on conflict (season_id, player_low_id, player_high_id)
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

create or replace function public.list_direct_messages(
  actor_user_id uuid,
  target_conversation_id uuid,
  before_created_at timestamptz default null,
  before_message_id uuid default null,
  result_limit integer default 50
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
stable
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if result_limit < 1 or result_limit > 100 then
    raise exception 'Message limit must be between 1 and 100';
  end if;

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

  return query
  select page.message_id, page.conversation_id, page.author_player_id,
    page.author_display_name, page.body, page.created_at, page.is_own
  from (
    select message.id as message_id, message.conversation_id,
      message.author_player_id, author.display_name as author_display_name,
      message.body, message.created_at,
      message.author_player_id = actor_player_id as is_own
    from public.direct_messages message
    join public.players author on author.id = message.author_player_id
    where message.conversation_id = target_conversation_id
      and message.removed_at is null
      and (
        before_created_at is null
        or (message.created_at, message.id) < (
          before_created_at,
          coalesce(before_message_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
        )
      )
    order by message.created_at desc, message.id desc
    limit result_limit
  ) page
  order by page.created_at, page.message_id;
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

create or replace function public.mark_direct_chat_read(
  actor_user_id uuid,
  target_conversation_id uuid,
  read_through_at timestamptz default null
)
returns table (
  conversation_id uuid,
  player_id uuid,
  last_read_at timestamptz
)
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
  on conflict (conversation_id, player_id)
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
  on conflict (blocker_player_id, blocked_player_id)
  do update set blocker_player_id = excluded.blocker_player_id
  returning * into saved_block;

  return query
  select saved_block.blocked_player_id, target_player.display_name, saved_block.created_at;
end;
$$;

create or replace function public.unblock_player_chat(
  actor_user_id uuid,
  target_player_id uuid
)
returns boolean
language plpgsql
volatile
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

  delete from public.player_chat_blocks block
  where block.blocker_player_id = actor_player_id
    and block.blocked_player_id = target_player_id;
  return found;
end;
$$;

create or replace function public.list_blocked_chat_players(actor_user_id uuid)
returns table (
  player_id uuid,
  display_name text,
  blocked_at timestamptz
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
  select blocked.id, blocked.display_name, block.created_at
  from public.player_chat_blocks block
  join public.players blocked on blocked.id = block.blocked_player_id
  where block.blocker_player_id = actor_player_id
  order by blocked.display_name;
end;
$$;

revoke all on function public.list_direct_message_candidates(uuid)
  from public, anon, authenticated;
revoke all on function public.get_my_direct_message_inbox(uuid)
  from public, anon, authenticated;
revoke all on function public.start_direct_conversation(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.list_direct_messages(uuid, uuid, timestamptz, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.send_direct_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_direct_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.block_player_chat(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.unblock_player_chat(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.list_blocked_chat_players(uuid)
  from public, anon, authenticated;

grant execute on function public.list_direct_message_candidates(uuid) to service_role;
grant execute on function public.get_my_direct_message_inbox(uuid) to service_role;
grant execute on function public.start_direct_conversation(uuid, uuid, uuid) to service_role;
grant execute on function public.list_direct_messages(uuid, uuid, timestamptz, uuid, integer)
  to service_role;
grant execute on function public.send_direct_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_direct_chat_read(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.block_player_chat(uuid, uuid) to service_role;
grant execute on function public.unblock_player_chat(uuid, uuid) to service_role;
grant execute on function public.list_blocked_chat_players(uuid) to service_role;

comment on table public.player_chat_blocks is
  'A block prevents new or continued direct messaging in either direction without affecting required league records or scheduling visibility.';
