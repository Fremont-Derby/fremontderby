create table public.league_chat_messages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete restrict,
  client_message_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null
);

create table public.league_chat_reads (
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  last_read_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (season_id, player_id)
);

create table public.chat_message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_player_id uuid not null references public.players(id) on delete cascade,
  target_type text not null check (target_type in ('team', 'direct', 'league')),
  team_message_id uuid references public.team_chat_messages(id) on delete cascade,
  direct_message_id uuid references public.direct_messages(id) on delete cascade,
  league_message_id uuid references public.league_chat_messages(id) on delete cascade,
  reason text not null check (reason in ('harassment', 'spam', 'privacy', 'threat', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000),
  check (
    num_nonnulls(team_message_id, direct_message_id, league_message_id) = 1
    and (target_type = 'team') = (team_message_id is not null)
    and (target_type = 'direct') = (direct_message_id is not null)
    and (target_type = 'league') = (league_message_id is not null)
  )
);

create unique index league_chat_messages_author_client_idx
  on public.league_chat_messages (author_player_id, client_message_id)
  where client_message_id is not null;
create index league_chat_messages_season_created_idx
  on public.league_chat_messages (season_id, created_at desc, id desc)
  where removed_at is null;
create index league_chat_messages_author_idx
  on public.league_chat_messages (author_player_id);
create index league_chat_messages_removed_by_idx
  on public.league_chat_messages (removed_by);
create index league_chat_reads_player_idx
  on public.league_chat_reads (player_id);
create unique index chat_message_reports_team_reporter_idx
  on public.chat_message_reports (reporter_player_id, team_message_id)
  where team_message_id is not null;
create unique index chat_message_reports_direct_reporter_idx
  on public.chat_message_reports (reporter_player_id, direct_message_id)
  where direct_message_id is not null;
create unique index chat_message_reports_league_reporter_idx
  on public.chat_message_reports (reporter_player_id, league_message_id)
  where league_message_id is not null;
create index chat_message_reports_team_message_idx
  on public.chat_message_reports (team_message_id);
create index chat_message_reports_direct_message_idx
  on public.chat_message_reports (direct_message_id);
create index chat_message_reports_league_message_idx
  on public.chat_message_reports (league_message_id);
create index chat_message_reports_reviewed_by_idx
  on public.chat_message_reports (reviewed_by);
create index chat_message_reports_status_created_idx
  on public.chat_message_reports (status, created_at);

alter table public.league_chat_messages enable row level security;
alter table public.league_chat_reads enable row level security;
alter table public.chat_message_reports enable row level security;

create policy "Browser roles cannot access league chat messages"
on public.league_chat_messages for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access league chat reads"
on public.league_chat_reads for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access chat message reports"
on public.chat_message_reports for all to anon, authenticated
using (false) with check (false);

revoke all on table public.league_chat_messages from public, anon, authenticated;
revoke all on table public.league_chat_reads from public, anon, authenticated;
revoke all on table public.chat_message_reports from public, anon, authenticated;
grant select, insert, update, delete on table public.league_chat_messages to service_role;
grant select, insert, update, delete on table public.league_chat_reads to service_role;
grant select, insert, update, delete on table public.chat_message_reports to service_role;

create or replace function private.is_season_chat_participant(
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
    from public.seasons season
    where season.id = target_season_id
      and (
        exists (
          select 1 from public.season_players season_player
          where season_player.season_id = season.id
            and season_player.player_id = target_player_id
            and season_player.status = 'active'
        )
        or exists (
          select 1 from public.team_memberships membership
          where membership.season_id = season.id
            and membership.player_id = target_player_id
        )
      )
  );
$$;

create or replace function public.get_my_league_chat_inbox(actor_user_id uuid)
returns table (
  season_id uuid,
  season_name text,
  last_message_body text,
  last_message_at timestamptz,
  unread_count bigint,
  can_send boolean
)
language plpgsql
stable
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

  return query
  with participant_seasons as (
    select season_player.season_id
    from public.season_players season_player
    where season_player.player_id = actor_player_id
      and season_player.status = 'active'
    union
    select membership.season_id
    from public.team_memberships membership
    where membership.player_id = actor_player_id
  )
  select season.id, season.name, latest.body, latest.created_at,
    count(unread.id)::bigint,
    private.is_active_season_participant(actor_player_id, season.id)
  from participant_seasons participant
  join public.seasons season on season.id = participant.season_id
  left join public.league_chat_reads read_state
    on read_state.season_id = season.id
    and read_state.player_id = actor_player_id
  left join lateral (
    select message.body, message.created_at
    from public.league_chat_messages message
    where message.season_id = season.id and message.removed_at is null
    order by message.created_at desc, message.id desc
    limit 1
  ) latest on true
  left join public.league_chat_messages unread
    on unread.season_id = season.id
    and unread.created_at > coalesce(read_state.last_read_at, season.created_at)
    and unread.author_player_id <> actor_player_id
    and unread.removed_at is null
  group by season.id, season.name, latest.body, latest.created_at
  order by
    private.is_active_season_participant(actor_player_id, season.id) desc,
    latest.created_at desc nulls last,
    season.created_at desc;
end;
$$;

create or replace function public.list_league_chat_messages(
  actor_user_id uuid,
  target_season_id uuid,
  before_created_at timestamptz default null,
  before_message_id uuid default null,
  result_limit integer default 50
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
  select page.message_id, page.season_id, page.author_player_id,
    page.author_display_name, page.body, page.created_at, page.is_own
  from (
    select message.id as message_id, message.season_id,
      message.author_player_id, author.display_name as author_display_name,
      message.body, message.created_at,
      message.author_player_id = actor_player_id as is_own
    from public.league_chat_messages message
    join public.players author on author.id = message.author_player_id
    where message.season_id = target_season_id
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
  on conflict (author_player_id, client_message_id)
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
  on conflict (season_id, player_id) do update
    set last_read_at = greatest(public.league_chat_reads.last_read_at, excluded.last_read_at),
        updated_at = clock_timestamp()
  returning public.league_chat_reads.season_id,
    public.league_chat_reads.player_id,
    public.league_chat_reads.last_read_at;
end;
$$;

create or replace function public.report_chat_message(
  actor_user_id uuid,
  target_type text,
  target_message_id uuid,
  report_reason text,
  report_details text default null
)
returns table (report_id uuid, status text, created_at timestamptz)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_author_id uuid;
  target_team_message_id uuid;
  target_direct_message_id uuid;
  target_league_message_id uuid;
  saved_report public.chat_message_reports%rowtype;
begin
  target_type := lower(btrim(target_type));
  report_reason := lower(btrim(report_reason));
  report_details := nullif(btrim(report_details), '');
  if target_type not in ('team', 'direct', 'league') then
    raise exception 'Unsupported chat message type';
  end if;
  if report_reason not in ('harassment', 'spam', 'privacy', 'threat', 'other') then
    raise exception 'Choose a valid report reason';
  end if;
  if report_details is not null and char_length(report_details) > 1000 then
    raise exception 'Report details cannot exceed 1000 characters';
  end if;

  select player.id into actor_player_id
  from public.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before reporting chat';
  end if;

  if target_type = 'team' then
    select message.id, message.author_player_id
      into target_team_message_id, target_author_id
    from public.team_chat_messages message
    where message.id = target_message_id
      and exists (
        select 1 from public.team_memberships membership
        where membership.player_id = actor_player_id
          and membership.season_id = message.season_id
          and membership.team_id = message.team_id
          and membership.starts_at <= message.created_at
          and (membership.ends_at is null or message.created_at < membership.ends_at)
      );
  elsif target_type = 'direct' then
    select message.id, message.author_player_id
      into target_direct_message_id, target_author_id
    from public.direct_messages message
    join public.direct_conversations conversation
      on conversation.id = message.conversation_id
    where message.id = target_message_id
      and actor_player_id in (conversation.player_low_id, conversation.player_high_id);
  else
    select message.id, message.author_player_id
      into target_league_message_id, target_author_id
    from public.league_chat_messages message
    where message.id = target_message_id
      and private.is_season_chat_participant(actor_player_id, message.season_id);
  end if;

  if target_author_id is null then raise exception 'Chat message not found'; end if;
  if target_author_id = actor_player_id then raise exception 'Cannot report your own message'; end if;

  select report.* into saved_report
  from public.chat_message_reports report
  where report.reporter_player_id = actor_player_id
    and (
      report.team_message_id = target_team_message_id
      or report.direct_message_id = target_direct_message_id
      or report.league_message_id = target_league_message_id
    )
  limit 1;

  if saved_report.id is null then
    insert into public.chat_message_reports (
      reporter_player_id, target_type, team_message_id, direct_message_id,
      league_message_id, reason, details
    ) values (
      actor_player_id, target_type, target_team_message_id, target_direct_message_id,
      target_league_message_id, report_reason, report_details
    ) returning * into saved_report;
  end if;

  return query select saved_report.id, saved_report.status, saved_report.created_at;
end;
$$;

create or replace function public.list_chat_message_reports(
  actor_user_id uuid,
  result_limit integer default 50
)
returns table (
  report_id uuid,
  target_type text,
  message_id uuid,
  context_label text,
  reporter_display_name text,
  author_display_name text,
  message_body text,
  reason text,
  details text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from private.league_admins admin where admin.user_id = actor_user_id) then
    raise exception 'League admin access is required';
  end if;
  if result_limit < 1 or result_limit > 100 then
    raise exception 'Report limit must be between 1 and 100';
  end if;

  return query
  select report.id, report.target_type,
    coalesce(report.team_message_id, report.direct_message_id, report.league_message_id),
    case report.target_type
      when 'team' then team.name || ' · ' || team_season.name
      when 'league' then 'League · ' || league_season.name
      else 'Direct message'
    end,
    reporter.display_name,
    coalesce(team_author.display_name, direct_author.display_name, league_author.display_name),
    coalesce(team_message.body, direct_message.body, league_message.body),
    report.reason, report.details, report.status, report.created_at
  from public.chat_message_reports report
  join public.players reporter on reporter.id = report.reporter_player_id
  left join public.team_chat_messages team_message on team_message.id = report.team_message_id
  left join public.players team_author on team_author.id = team_message.author_player_id
  left join public.teams team on team.id = team_message.team_id
  left join public.seasons team_season on team_season.id = team_message.season_id
  left join public.direct_messages direct_message on direct_message.id = report.direct_message_id
  left join public.players direct_author on direct_author.id = direct_message.author_player_id
  left join public.league_chat_messages league_message on league_message.id = report.league_message_id
  left join public.players league_author on league_author.id = league_message.author_player_id
  left join public.seasons league_season on league_season.id = league_message.season_id
  order by (report.status in ('open', 'reviewing')) desc, report.created_at;
end;
$$;

create or replace function public.moderate_chat_message_report(
  actor_user_id uuid,
  target_report_id uuid,
  resolution text,
  moderation_note text default null,
  remove_message boolean default false
)
returns table (report_id uuid, status text, reviewed_at timestamptz, message_removed boolean)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  report public.chat_message_reports%rowtype;
  resolved_at timestamptz := clock_timestamp();
begin
  if not exists (select 1 from private.league_admins admin where admin.user_id = actor_user_id) then
    raise exception 'League admin access is required';
  end if;
  resolution := lower(btrim(resolution));
  moderation_note := nullif(btrim(moderation_note), '');
  if resolution not in ('resolved', 'dismissed') then
    raise exception 'Resolution must be resolved or dismissed';
  end if;
  if remove_message and resolution <> 'resolved' then
    raise exception 'A removed message must use resolved status';
  end if;
  if moderation_note is not null and char_length(moderation_note) > 2000 then
    raise exception 'Moderation note cannot exceed 2000 characters';
  end if;

  select target.* into report
  from public.chat_message_reports target
  where target.id = target_report_id
  for update;
  if report.id is null then raise exception 'Chat report not found'; end if;

  if remove_message then
    if report.target_type = 'team' then
      update public.team_chat_messages set removed_at = resolved_at, removed_by = actor_user_id
      where id = report.team_message_id;
    elsif report.target_type = 'direct' then
      update public.direct_messages set removed_at = resolved_at, removed_by = actor_user_id
      where id = report.direct_message_id;
    else
      update public.league_chat_messages set removed_at = resolved_at, removed_by = actor_user_id
      where id = report.league_message_id;
    end if;
  end if;

  update public.chat_message_reports target
  set status = resolution, reviewed_at = resolved_at, reviewed_by = actor_user_id,
      resolution_note = moderation_note
  where target.id = report.id;

  return query select report.id, resolution, resolved_at, remove_message;
end;
$$;

revoke all on function private.is_season_chat_participant(uuid, uuid) from public, anon, authenticated;
grant execute on function private.is_season_chat_participant(uuid, uuid) to service_role;

revoke all on function public.get_my_league_chat_inbox(uuid) from public, anon, authenticated;
revoke all on function public.list_league_chat_messages(uuid, uuid, timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.send_league_chat_message(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_league_chat_read(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.report_chat_message(uuid, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.list_chat_message_reports(uuid, integer) from public, anon, authenticated;
revoke all on function public.moderate_chat_message_report(uuid, uuid, text, text, boolean) from public, anon, authenticated;

grant execute on function public.get_my_league_chat_inbox(uuid) to service_role;
grant execute on function public.list_league_chat_messages(uuid, uuid, timestamptz, uuid, integer) to service_role;
grant execute on function public.send_league_chat_message(uuid, uuid, text, uuid) to service_role;
grant execute on function public.mark_league_chat_read(uuid, uuid, timestamptz) to service_role;
grant execute on function public.report_chat_message(uuid, text, uuid, text, text) to service_role;
grant execute on function public.list_chat_message_reports(uuid, integer) to service_role;
grant execute on function public.moderate_chat_message_report(uuid, uuid, text, text, boolean) to service_role;
