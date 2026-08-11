create table public.team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null,
  author_player_id uuid not null references public.players(id) on delete restrict,
  client_message_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  unique (author_player_id, client_message_id)
);

create index team_chat_messages_team_created_idx
  on public.team_chat_messages (team_id, created_at desc, id desc);

create table public.team_chat_reads (
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null,
  player_id uuid not null references public.players(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (team_id, player_id),
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade
);

alter table public.team_chat_messages enable row level security;
alter table public.team_chat_reads enable row level security;

revoke all on public.team_chat_messages, public.team_chat_reads
  from public, anon, authenticated;
grant all on public.team_chat_messages, public.team_chat_reads
  to service_role;

create or replace function public.get_my_team_chat_inbox(actor_user_id uuid)
returns table (
  team_id uuid,
  team_name text,
  season_id uuid,
  season_name text,
  member_role text,
  last_message_body text,
  last_message_at timestamptz,
  unread_count bigint
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
    t.id,
    t.name,
    s.id,
    s.name,
    tm.role,
    latest.body,
    latest.created_at,
    count(unread.id)::bigint
  from public.team_memberships tm
  join public.teams t on t.id = tm.team_id and t.season_id = tm.season_id
  join public.seasons s on s.id = tm.season_id
  left join public.team_chat_reads tcr
    on tcr.team_id = tm.team_id and tcr.player_id = actor_player_id
  left join lateral (
    select m.body, m.created_at
    from public.team_chat_messages m
    where m.team_id = tm.team_id
      and m.created_at >= tm.starts_at
      and m.removed_at is null
    order by m.created_at desc, m.id desc
    limit 1
  ) latest on true
  left join public.team_chat_messages unread
    on unread.team_id = tm.team_id
    and unread.created_at > coalesce(tcr.last_read_at, tm.starts_at)
    and unread.author_player_id <> actor_player_id
    and unread.removed_at is null
  where tm.player_id = actor_player_id
    and tm.ends_at is null
  group by t.id, t.name, s.id, s.name, tm.role, latest.body, latest.created_at
  order by latest.created_at desc nulls last, t.name;
end;
$$;

create or replace function public.list_team_chat_messages(
  actor_user_id uuid,
  target_team_id uuid,
  before_created_at timestamptz default null,
  result_limit integer default 50
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

  if not exists (select 1 from public.teams t where t.id = target_team_id) then
    raise exception 'Team not found';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
  ) then
    raise exception 'No team chat access';
  end if;

  return query
  select page.message_id, page.team_id, page.author_player_id,
    page.author_display_name, page.body, page.created_at, page.is_own
  from (
    select m.id as message_id, m.team_id, m.author_player_id,
      author.display_name as author_display_name, m.body, m.created_at,
      m.author_player_id = actor_player_id as is_own
    from public.team_chat_messages m
    join public.players author on author.id = m.author_player_id
    where m.team_id = target_team_id
      and m.removed_at is null
      and (before_created_at is null or m.created_at < before_created_at)
      and exists (
        select 1
        from public.team_memberships access_membership
        where access_membership.team_id = m.team_id
          and access_membership.player_id = actor_player_id
          and m.created_at >= access_membership.starts_at
          and (
            access_membership.ends_at is null
            or m.created_at <= access_membership.ends_at
          )
      )
    order by m.created_at desc, m.id desc
    limit result_limit
  ) page
  order by page.created_at, page.message_id;
end;
$$;

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
  on conflict (author_player_id, client_message_id)
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
returns table (
  team_id uuid,
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
  on conflict (team_id, player_id)
  do update set last_read_at = greatest(
    public.team_chat_reads.last_read_at,
    excluded.last_read_at
  );

  return query
  select r.team_id, r.player_id, r.last_read_at
  from public.team_chat_reads r
  where r.team_id = target_team_id and r.player_id = actor_player_id;
end;
$$;

revoke all on function public.get_my_team_chat_inbox(uuid)
  from public, anon, authenticated;
revoke all on function public.list_team_chat_messages(uuid, uuid, timestamptz, integer)
  from public, anon, authenticated;
revoke all on function public.send_team_chat_message(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_team_chat_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.get_my_team_chat_inbox(uuid) to service_role;
grant execute on function public.list_team_chat_messages(uuid, uuid, timestamptz, integer)
  to service_role;
grant execute on function public.send_team_chat_message(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.mark_team_chat_read(uuid, uuid, timestamptz)
  to service_role;

comment on table public.team_chat_messages is
  'Private team chat. Worker-authenticated service-role RPCs enforce membership windows; browser roles have no direct access.';
