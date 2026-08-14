-- In-app notifications + admin broadcast + helpers for league lifecycle notices.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  href text,
  team_id uuid,
  team_match_id uuid,
  season_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists user_notifications_recipient_created_idx
  on public.user_notifications (recipient_user_id, created_at desc);

create index if not exists user_notifications_recipient_unread_idx
  on public.user_notifications (recipient_user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

grant select, insert, update on public.user_notifications to service_role;

create or replace function public.list_my_notifications(
  actor_user_id uuid,
  result_limit integer default 50
)
returns table (
  id uuid,
  kind text,
  title text,
  body text,
  href text,
  team_id uuid,
  team_match_id uuid,
  season_id uuid,
  read_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    n.id,
    n.kind,
    n.title,
    n.body,
    n.href,
    n.team_id,
    n.team_match_id,
    n.season_id,
    n.read_at,
    n.created_at
  from public.user_notifications n
  where n.recipient_user_id = actor_user_id
  order by n.created_at desc
  limit greatest(1, least(coalesce(result_limit, 50), 100));
$$;

create or replace function public.mark_my_notification_read(
  actor_user_id uuid,
  target_notification_id uuid
)
returns table (
  id uuid,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_notifications n
  set read_at = coalesce(n.read_at, now())
  where n.id = target_notification_id
    and n.recipient_user_id = actor_user_id;

  if not found then
    raise exception 'Notification not found';
  end if;

  return query
  select n.id, n.read_at
  from public.user_notifications n
  where n.id = target_notification_id;
end;
$$;

create or replace function public.mark_all_my_notifications_read(
  actor_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.user_notifications n
  set read_at = now()
  where n.recipient_user_id = actor_user_id
    and n.read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Admin broadcast to every linked player account in a season (or all linked players).
create or replace function public.admin_broadcast_notification(
  actor_user_id uuid,
  notice_title text,
  notice_body text,
  target_season_id uuid default null,
  notice_href text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_title text := nullif(btrim(coalesce(notice_title, '')), '');
  cleaned_body text := nullif(btrim(coalesce(notice_body, '')), '');
  cleaned_href text := nullif(btrim(coalesce(notice_href, '')), '');
  inserted_count integer := 0;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if cleaned_title is null or char_length(cleaned_title) > 120 then
    raise exception 'title is required (max 120 characters)';
  end if;
  if cleaned_body is null or char_length(cleaned_body) > 500 then
    raise exception 'body is required (max 500 characters)';
  end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;

  insert into public.user_notifications (
    recipient_user_id, kind, title, body, href, season_id, created_by
  )
  select distinct p.user_id,
    'admin_broadcast',
    cleaned_title,
    cleaned_body,
    cleaned_href,
    target_season_id,
    actor_user_id
  from public.players p
  where p.user_id is not null
    and (
      target_season_id is null
      or exists (
        select 1 from public.season_players sp
        where sp.player_id = p.id
          and sp.season_id = target_season_id
          and sp.status = 'active'
      )
      or exists (
        select 1 from public.team_memberships tm
        where tm.player_id = p.id
          and tm.season_id = target_season_id
          and tm.ends_at is null
      )
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.create_user_notification(
  recipient_user_id uuid,
  notice_kind text,
  notice_title text,
  notice_body text,
  notice_href text default null,
  notice_team_id uuid default null,
  notice_team_match_id uuid default null,
  notice_season_id uuid default null,
  actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.user_notifications (
    recipient_user_id, kind, title, body, href, team_id, team_match_id, season_id, created_by
  ) values (
    recipient_user_id,
    notice_kind,
    btrim(notice_title),
    btrim(notice_body),
    nullif(btrim(coalesce(notice_href, '')), ''),
    notice_team_id,
    notice_team_match_id,
    notice_season_id,
    actor_user_id
  )
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.list_my_notifications(uuid, integer) from public, anon, authenticated;
grant execute on function public.list_my_notifications(uuid, integer) to service_role;
revoke all on function public.mark_my_notification_read(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_my_notification_read(uuid, uuid) to service_role;
revoke all on function public.mark_all_my_notifications_read(uuid) from public, anon, authenticated;
grant execute on function public.mark_all_my_notifications_read(uuid) to service_role;
revoke all on function public.admin_broadcast_notification(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_broadcast_notification(uuid, text, text, uuid, text) to service_role;
revoke all on function public.create_user_notification(uuid, text, text, text, text, uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_user_notification(uuid, text, text, text, text, uuid, uuid, uuid, uuid) to service_role;
