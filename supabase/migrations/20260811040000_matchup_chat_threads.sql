create table public.matchup_chat_messages (
  id uuid primary key default gen_random_uuid(),
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete restrict,
  author_team_id uuid not null references public.teams(id) on delete restrict,
  client_message_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  unique (author_player_id, client_message_id)
);

create table public.matchup_chat_reads (
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  last_read_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (team_match_id, player_id)
);

create index matchup_chat_messages_match_created_idx
  on public.matchup_chat_messages (team_match_id, created_at desc, id desc)
  where removed_at is null;
create index matchup_chat_messages_author_idx on public.matchup_chat_messages (author_player_id);
create index matchup_chat_messages_author_team_idx on public.matchup_chat_messages (author_team_id);
create index matchup_chat_messages_removed_by_idx on public.matchup_chat_messages (removed_by);
create index matchup_chat_reads_player_idx on public.matchup_chat_reads (player_id);

alter table public.matchup_chat_messages enable row level security;
alter table public.matchup_chat_reads enable row level security;
create policy "Browser roles cannot access matchup chat messages"
on public.matchup_chat_messages for all to anon, authenticated
using (false) with check (false);
create policy "Browser roles cannot access matchup chat reads"
on public.matchup_chat_reads for all to anon, authenticated
using (false) with check (false);
revoke all on table public.matchup_chat_messages from public, anon, authenticated;
revoke all on table public.matchup_chat_reads from public, anon, authenticated;
grant select, insert, update, delete on table public.matchup_chat_messages to service_role;
grant select, insert, update, delete on table public.matchup_chat_reads to service_role;

alter table public.chat_message_reports
  add column matchup_message_id uuid references public.matchup_chat_messages(id) on delete cascade;
alter table public.chat_message_reports drop constraint chat_message_reports_target_type_check;
alter table public.chat_message_reports drop constraint chat_message_reports_check;
alter table public.chat_message_reports
  add constraint chat_message_reports_target_type_check
  check (target_type in ('team', 'direct', 'league', 'matchup'));
alter table public.chat_message_reports
  add constraint chat_message_reports_target_check check (
    num_nonnulls(team_message_id, direct_message_id, league_message_id, matchup_message_id) = 1
    and (target_type = 'team') = (team_message_id is not null)
    and (target_type = 'direct') = (direct_message_id is not null)
    and (target_type = 'league') = (league_message_id is not null)
    and (target_type = 'matchup') = (matchup_message_id is not null)
  );
create unique index chat_message_reports_matchup_reporter_idx
  on public.chat_message_reports (reporter_player_id, matchup_message_id)
  where matchup_message_id is not null;
create index chat_message_reports_matchup_message_idx
  on public.chat_message_reports (matchup_message_id);

create or replace function public.get_my_matchup_chat_inbox(actor_user_id uuid)
returns table (
  team_match_id uuid,
  season_id uuid,
  season_name text,
  round_number integer,
  scheduled_on date,
  team_a_name text,
  team_b_name text,
  last_message_body text,
  last_message_at timestamptz,
  unread_count bigint,
  can_send boolean
)
language plpgsql stable security invoker set search_path = ''
as $$
declare actor_player_id uuid;
begin
  select player.id into actor_player_id from public.players player where player.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required before using chat'; end if;

  return query
  select match.id, match.season_id, season.name, round.round_number, round.scheduled_on,
    team_a.name, team_b.name, latest.body, latest.created_at,
    count(unread.id)::bigint,
    season.status in ('registration', 'active', 'playoffs')
      and match.status not in ('finalized', 'corrected', 'cancelled')
      and exists (
        select 1 from public.team_memberships membership
        where membership.player_id = actor_player_id
          and membership.season_id = match.season_id
          and membership.team_id in (match.team_a_id, match.team_b_id)
          and membership.ends_at is null
      )
  from public.team_matches match
  join public.seasons season on season.id = match.season_id
  join public.rounds round on round.id = match.round_id
  join public.teams team_a on team_a.id = match.team_a_id
  join public.teams team_b on team_b.id = match.team_b_id
  left join public.matchup_chat_reads read_state
    on read_state.team_match_id = match.id and read_state.player_id = actor_player_id
  left join lateral (
    select message.body, message.created_at
    from public.matchup_chat_messages message
    where message.team_match_id = match.id and message.removed_at is null
      and exists (
        select 1 from public.team_memberships access_membership
        where access_membership.player_id = actor_player_id
          and access_membership.season_id = match.season_id
          and access_membership.team_id in (match.team_a_id, match.team_b_id)
          and access_membership.starts_at <= message.created_at
          and (access_membership.ends_at is null or message.created_at < access_membership.ends_at)
      )
    order by message.created_at desc, message.id desc limit 1
  ) latest on true
  left join public.matchup_chat_messages unread
    on unread.team_match_id = match.id
    and unread.created_at > coalesce(read_state.last_read_at, match.created_at)
    and unread.author_player_id <> actor_player_id and unread.removed_at is null
    and exists (
      select 1 from public.team_memberships access_membership
      where access_membership.player_id = actor_player_id
        and access_membership.season_id = match.season_id
        and access_membership.team_id in (match.team_a_id, match.team_b_id)
        and access_membership.starts_at <= unread.created_at
        and (access_membership.ends_at is null or unread.created_at < access_membership.ends_at)
    )
  where exists (
    select 1 from public.team_memberships membership
    where membership.player_id = actor_player_id
      and membership.season_id = match.season_id
      and membership.team_id in (match.team_a_id, match.team_b_id)
  )
  group by match.id, season.id, season.name, round.round_number, round.scheduled_on,
    team_a.name, team_b.name, latest.body, latest.created_at
  order by
    (match.status not in ('finalized', 'corrected', 'cancelled')) desc,
    round.scheduled_on desc nulls last, round.round_number desc;
end;
$$;

create or replace function public.list_matchup_chat_messages(
  actor_user_id uuid,
  target_team_match_id uuid,
  before_created_at timestamptz default null,
  before_message_id uuid default null,
  result_limit integer default 50
)
returns table (
  message_id uuid, team_match_id uuid, author_player_id uuid,
  author_display_name text, author_team_name text, body text,
  created_at timestamptz, is_own boolean
)
language plpgsql stable security invoker set search_path = ''
as $$
declare actor_player_id uuid;
begin
  if result_limit < 1 or result_limit > 100 then raise exception 'Message limit must be between 1 and 100'; end if;
  select player.id into actor_player_id from public.players player where player.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required before using chat'; end if;
  if not exists (
    select 1 from public.team_matches match
    join public.team_memberships membership
      on membership.season_id = match.season_id
      and membership.team_id in (match.team_a_id, match.team_b_id)
      and membership.player_id = actor_player_id
    where match.id = target_team_match_id
  ) then raise exception 'Matchup chat access is required'; end if;

  return query
  select page.message_id, page.team_match_id, page.author_player_id,
    page.author_display_name, page.author_team_name, page.body, page.created_at, page.is_own
  from (
    select message.id message_id, message.team_match_id, message.author_player_id,
      author.display_name author_display_name, author_team.name author_team_name,
      message.body, message.created_at, message.author_player_id = actor_player_id is_own
    from public.matchup_chat_messages message
    join public.team_matches match on match.id = message.team_match_id
    join public.players author on author.id = message.author_player_id
    join public.teams author_team on author_team.id = message.author_team_id
    where message.team_match_id = target_team_match_id and message.removed_at is null
      and exists (
        select 1 from public.team_memberships membership
        where membership.player_id = actor_player_id
          and membership.season_id = match.season_id
          and membership.team_id in (match.team_a_id, match.team_b_id)
          and membership.starts_at <= message.created_at
          and (membership.ends_at is null or message.created_at < membership.ends_at)
      )
      and (
        before_created_at is null
        or (message.created_at, message.id) < (
          before_created_at,
          coalesce(before_message_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
        )
      )
    order by message.created_at desc, message.id desc limit result_limit
  ) page
  order by page.created_at, page.message_id;
end;
$$;

create or replace function public.send_matchup_chat_message(
  actor_user_id uuid,
  target_team_match_id uuid,
  message_body text,
  message_client_id uuid default null
)
returns table (
  message_id uuid, team_match_id uuid, author_player_id uuid,
  author_display_name text, author_team_name text, body text,
  created_at timestamptz, is_own boolean
)
language plpgsql volatile security invoker set search_path = ''
as $$
declare
  actor_player public.players%rowtype;
  target_match public.team_matches%rowtype;
  actor_team_id uuid;
  actor_team_name text;
  saved_message public.matchup_chat_messages%rowtype;
begin
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then raise exception 'Message cannot be empty'; end if;
  if char_length(message_body) > 2000 then raise exception 'Message cannot exceed 2000 characters'; end if;
  select player.* into actor_player from public.players player where player.user_id = actor_user_id;
  if actor_player.id is null then raise exception 'Player profile is required before using chat'; end if;
  select match.* into target_match from public.team_matches match where match.id = target_team_match_id;
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
  order by membership.starts_at desc limit 1;
  if actor_team_id is null then raise exception 'Current matchup team membership is required'; end if;

  insert into public.matchup_chat_messages (
    team_match_id, author_player_id, author_team_id, client_message_id, body
  ) values (
    target_match.id, actor_player.id, actor_team_id, message_client_id, message_body
  ) on conflict (author_player_id, client_message_id)
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
language plpgsql volatile security invoker set search_path = ''
as $$
declare actor_player_id uuid;
begin
  select player.id into actor_player_id from public.players player where player.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required before using chat'; end if;
  if not exists (
    select 1 from public.team_matches match join public.team_memberships membership
      on membership.season_id = match.season_id
      and membership.team_id in (match.team_a_id, match.team_b_id)
      and membership.player_id = actor_player_id
    where match.id = target_team_match_id
  ) then raise exception 'Matchup chat access is required'; end if;

  return query insert into public.matchup_chat_reads (team_match_id, player_id, last_read_at)
  values (target_team_match_id, actor_player_id, coalesce(read_through_at, clock_timestamp()))
  on conflict (team_match_id, player_id) do update
    set last_read_at = greatest(public.matchup_chat_reads.last_read_at, excluded.last_read_at),
        updated_at = clock_timestamp()
  returning public.matchup_chat_reads.team_match_id,
    public.matchup_chat_reads.player_id, public.matchup_chat_reads.last_read_at;
end;
$$;

create or replace function public.report_chat_message(
  actor_user_id uuid, target_type text, target_message_id uuid,
  report_reason text, report_details text default null
)
returns table (report_id uuid, status text, created_at timestamptz)
language plpgsql volatile security invoker set search_path = ''
as $$
declare
  actor_player_id uuid; target_author_id uuid;
  target_team_message_id uuid; target_direct_message_id uuid;
  target_league_message_id uuid; target_matchup_message_id uuid;
  saved_report public.chat_message_reports%rowtype;
begin
  target_type := lower(btrim(target_type)); report_reason := lower(btrim(report_reason));
  report_details := nullif(btrim(report_details), '');
  if target_type not in ('team', 'direct', 'league', 'matchup') then raise exception 'Unsupported chat message type'; end if;
  if report_reason not in ('harassment', 'spam', 'privacy', 'threat', 'other') then raise exception 'Choose a valid report reason'; end if;
  if report_details is not null and char_length(report_details) > 1000 then raise exception 'Report details cannot exceed 1000 characters'; end if;
  select player.id into actor_player_id from public.players player where player.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required before reporting chat'; end if;

  if target_type = 'team' then
    select message.id, message.author_player_id into target_team_message_id, target_author_id
    from public.team_chat_messages message where message.id = target_message_id and exists (
      select 1 from public.team_memberships membership
      where membership.player_id = actor_player_id and membership.season_id = message.season_id
        and membership.team_id = message.team_id and membership.starts_at <= message.created_at
        and (membership.ends_at is null or message.created_at < membership.ends_at));
  elsif target_type = 'direct' then
    select message.id, message.author_player_id into target_direct_message_id, target_author_id
    from public.direct_messages message join public.direct_conversations conversation on conversation.id = message.conversation_id
    where message.id = target_message_id and actor_player_id in (conversation.player_low_id, conversation.player_high_id);
  elsif target_type = 'league' then
    select message.id, message.author_player_id into target_league_message_id, target_author_id
    from public.league_chat_messages message where message.id = target_message_id
      and private.is_season_chat_participant(actor_player_id, message.season_id);
  else
    select message.id, message.author_player_id into target_matchup_message_id, target_author_id
    from public.matchup_chat_messages message join public.team_matches match on match.id = message.team_match_id
    where message.id = target_message_id and exists (
      select 1 from public.team_memberships membership
      where membership.player_id = actor_player_id and membership.season_id = match.season_id
        and membership.team_id in (match.team_a_id, match.team_b_id)
        and membership.starts_at <= message.created_at
        and (membership.ends_at is null or message.created_at < membership.ends_at));
  end if;
  if target_author_id is null then raise exception 'Chat message not found'; end if;
  if target_author_id = actor_player_id then raise exception 'Cannot report your own message'; end if;

  select report.* into saved_report from public.chat_message_reports report
  where report.reporter_player_id = actor_player_id and (
    report.team_message_id = target_team_message_id
    or report.direct_message_id = target_direct_message_id
    or report.league_message_id = target_league_message_id
    or report.matchup_message_id = target_matchup_message_id) limit 1;
  if saved_report.id is null then
    insert into public.chat_message_reports (
      reporter_player_id, target_type, team_message_id, direct_message_id,
      league_message_id, matchup_message_id, reason, details
    ) values (
      actor_player_id, target_type, target_team_message_id, target_direct_message_id,
      target_league_message_id, target_matchup_message_id, report_reason, report_details
    ) returning * into saved_report;
  end if;
  return query select saved_report.id, saved_report.status, saved_report.created_at;
end;
$$;

create or replace function public.list_chat_message_reports(actor_user_id uuid, result_limit integer default 50)
returns table (
  report_id uuid, target_type text, message_id uuid, context_label text,
  reporter_display_name text, author_display_name text, message_body text,
  reason text, details text, status text, created_at timestamptz
)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not exists (select 1 from private.league_admins admin where admin.user_id = actor_user_id) then raise exception 'League admin access is required'; end if;
  if result_limit < 1 or result_limit > 100 then raise exception 'Report limit must be between 1 and 100'; end if;
  return query select report.id, report.target_type,
    coalesce(report.team_message_id, report.direct_message_id, report.league_message_id, report.matchup_message_id),
    case report.target_type
      when 'team' then team.name || ' · ' || team_season.name
      when 'league' then 'League · ' || league_season.name
      when 'matchup' then matchup_team_a.name || ' vs ' || matchup_team_b.name || ' · Round ' || matchup_round.round_number
      else 'Direct message'
    end,
    reporter.display_name,
    coalesce(team_author.display_name, direct_author.display_name, league_author.display_name, matchup_author.display_name),
    coalesce(team_message.body, direct_message.body, league_message.body, matchup_message.body),
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
  left join public.matchup_chat_messages matchup_message on matchup_message.id = report.matchup_message_id
  left join public.players matchup_author on matchup_author.id = matchup_message.author_player_id
  left join public.team_matches matchup on matchup.id = matchup_message.team_match_id
  left join public.teams matchup_team_a on matchup_team_a.id = matchup.team_a_id
  left join public.teams matchup_team_b on matchup_team_b.id = matchup.team_b_id
  left join public.rounds matchup_round on matchup_round.id = matchup.round_id
  order by (report.status in ('open', 'reviewing')) desc, report.created_at;
end;
$$;

create or replace function public.moderate_chat_message_report(
  actor_user_id uuid, target_report_id uuid, resolution text,
  moderation_note text default null, remove_message boolean default false
)
returns table (report_id uuid, status text, reviewed_at timestamptz, message_removed boolean)
language plpgsql volatile security invoker set search_path = ''
as $$
declare report public.chat_message_reports%rowtype; resolved_at timestamptz := clock_timestamp();
begin
  if not exists (select 1 from private.league_admins admin where admin.user_id = actor_user_id) then raise exception 'League admin access is required'; end if;
  resolution := lower(btrim(resolution)); moderation_note := nullif(btrim(moderation_note), '');
  if resolution not in ('resolved', 'dismissed') then raise exception 'Resolution must be resolved or dismissed'; end if;
  if remove_message and resolution <> 'resolved' then raise exception 'A removed message must use resolved status'; end if;
  if moderation_note is not null and char_length(moderation_note) > 2000 then raise exception 'Moderation note cannot exceed 2000 characters'; end if;
  select target.* into report from public.chat_message_reports target where target.id = target_report_id for update;
  if report.id is null then raise exception 'Chat report not found'; end if;
  if remove_message then
    if report.target_type = 'team' then update public.team_chat_messages set removed_at = resolved_at, removed_by = actor_user_id where id = report.team_message_id;
    elsif report.target_type = 'direct' then update public.direct_messages set removed_at = resolved_at, removed_by = actor_user_id where id = report.direct_message_id;
    elsif report.target_type = 'league' then update public.league_chat_messages set removed_at = resolved_at, removed_by = actor_user_id where id = report.league_message_id;
    else update public.matchup_chat_messages set removed_at = resolved_at, removed_by = actor_user_id where id = report.matchup_message_id;
    end if;
  end if;
  update public.chat_message_reports target set status = resolution, reviewed_at = resolved_at,
    reviewed_by = actor_user_id, resolution_note = moderation_note where target.id = report.id;
  return query select report.id, resolution, resolved_at, remove_message;
end;
$$;

revoke all on function public.get_my_matchup_chat_inbox(uuid) from public, anon, authenticated;
revoke all on function public.list_matchup_chat_messages(uuid, uuid, timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.send_matchup_chat_message(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_matchup_chat_read(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.report_chat_message(uuid, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.list_chat_message_reports(uuid, integer) from public, anon, authenticated;
revoke all on function public.moderate_chat_message_report(uuid, uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.get_my_matchup_chat_inbox(uuid) to service_role;
grant execute on function public.list_matchup_chat_messages(uuid, uuid, timestamptz, uuid, integer) to service_role;
grant execute on function public.send_matchup_chat_message(uuid, uuid, text, uuid) to service_role;
grant execute on function public.mark_matchup_chat_read(uuid, uuid, timestamptz) to service_role;
grant execute on function public.report_chat_message(uuid, text, uuid, text, text) to service_role;
grant execute on function public.list_chat_message_reports(uuid, integer) to service_role;
grant execute on function public.moderate_chat_message_report(uuid, uuid, text, text, boolean) to service_role;
