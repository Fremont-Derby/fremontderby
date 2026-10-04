-- Tracks #3304 / #3295. JFL-only independent social consent.
begin;
do $guard$
begin
  if to_regnamespace('jfl_private') is null or to_regclass('jfl.direct_message_consent') is null then
    raise exception 'Expected verified JFL consent baseline';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.get_my_league_chat_inbox(uuid)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='9d85dcbe4f60c9bcbe8a61d077236ab7') then
    raise exception 'Social chat source drift: get_my_league_chat_inbox';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.get_my_team_chat_inbox(uuid)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='d49b7e48aebbd82ff72bd59b9ef058ee') then
    raise exception 'Social chat source drift: get_my_team_chat_inbox';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.list_league_chat_messages(uuid,uuid,timestamptz,uuid,integer)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='c3eccbb7933ffae2cd4b84e6db4b77b4') then
    raise exception 'Social chat source drift: list_league_chat_messages';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.list_team_chat_messages(uuid,uuid,timestamptz,integer)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='95e27724f458dd66f2f7b41eb016db14') then
    raise exception 'Social chat source drift: list_team_chat_messages';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.mark_league_chat_read(uuid,uuid,timestamptz)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='040d64730ab49194862aafd0a39d2f15') then
    raise exception 'Social chat source drift: mark_league_chat_read';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.mark_team_chat_read(uuid,uuid,timestamptz)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='89a0fdf56467e09d32c5856f09de178b') then
    raise exception 'Social chat source drift: mark_team_chat_read';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.send_league_chat_message(uuid,uuid,text,uuid)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='e062b3f251132efdee023b7ea2e42d9f') then
    raise exception 'Social chat source drift: send_league_chat_message';
  end if;
  if not exists(select 1 from pg_proc where oid='jfl.send_team_chat_message(uuid,uuid,text,uuid)'::regprocedure and not prosecdef and md5(pg_get_functiondef(oid))='927357f6f10976eb861a7bde597bc546') then
    raise exception 'Social chat source drift: send_team_chat_message';
  end if;
end;
$guard$;
create table jfl.social_chat_consent (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check(channel in ('general','team')),
  enabled boolean not null default false,
  primary key(user_id,channel)
);
alter table jfl.social_chat_consent enable row level security;
revoke all on jfl.social_chat_consent from public,anon,authenticated;
grant select,insert,update on jfl.social_chat_consent to service_role;

create function jfl_private.social_chat_enabled(target_user_id uuid, target_channel text)
returns boolean language sql stable security invoker set search_path='' as $fn$
  select coalesce((select enabled from jfl.social_chat_consent where user_id=target_user_id and channel=target_channel),false);
$fn$;
create function jfl_private.lock_social_chat_consent(target_user_id uuid, target_channel text)
returns boolean language plpgsql volatile security invoker set search_path='' as $fn$
declare current_enabled boolean;
begin
  if target_user_id is null or target_channel not in ('general','team') then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('jfl:social:'||target_channel||':'||target_user_id::text,0));
  select enabled into current_enabled from jfl.social_chat_consent
    where user_id=target_user_id and channel=target_channel for update;
  return coalesce(current_enabled,false);
end;
$fn$;
create function jfl_private.lock_social_chat_preference_write()
returns trigger language plpgsql security invoker set search_path='' as $fn$
begin
  if TG_OP='UPDATE' and (new.user_id<>old.user_id or new.channel<>old.channel) then
    raise exception 'Preference owner and channel cannot change' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('jfl:social:'||new.channel||':'||new.user_id::text,0));
  return new;
end;
$fn$;
create trigger social_chat_preference_lock before insert or update on jfl.social_chat_consent
for each row execute function jfl_private.lock_social_chat_preference_write();

create function jfl.get_social_chat_consent(actor_user_id uuid, channel text)
returns boolean language sql stable security invoker set search_path='' as $fn$
  select jfl_private.social_chat_enabled(actor_user_id,channel);
$fn$;
create function jfl.set_social_chat_consent(actor_user_id uuid, channel text, enabled boolean)
returns boolean language plpgsql volatile security invoker set search_path='' as $fn$
begin
  if actor_user_id is null or channel is null or channel not in ('general','team') or enabled is null then
    raise exception 'Explicit account, channel and boolean required';
  end if;
  perform jfl_private.lock_social_chat_consent(actor_user_id,channel);
  insert into jfl.social_chat_consent(user_id,channel,enabled) values(actor_user_id,channel,enabled)
    on conflict on constraint social_chat_consent_pkey do update set enabled=excluded.enabled;
  return enabled;
end;
$fn$;
create function jfl_private.require_social_chat_consent(target_user_id uuid,target_channel text)
returns void language plpgsql volatile security invoker set search_path='' as $fn$
begin
  if not jfl_private.lock_social_chat_consent(target_user_id,target_channel) then
    raise exception 'Social chat unavailable' using errcode='42501';
  end if;
end;
$fn$;
create function jfl_private.enforce_social_chat_message_consent()
returns trigger language plpgsql security invoker set search_path='' as $fn$
declare author_user_id uuid;
begin
  select user_id into author_user_id from jfl.players where id=new.author_player_id;
  perform jfl_private.require_social_chat_consent(author_user_id,TG_ARGV[0]);
  return new;
end;
$fn$;
create function jfl_private.enforce_social_chat_read_consent()
returns trigger language plpgsql security invoker set search_path='' as $fn$
declare reader_user_id uuid;
begin
  select user_id into reader_user_id from jfl.players where id=new.player_id;
  perform jfl_private.require_social_chat_consent(reader_user_id,TG_ARGV[0]);
  return new;
end;
$fn$;
create trigger team_social_message_consent before insert or update of season_id,team_id,author_player_id,body,client_message_id
on jfl.team_chat_messages for each row execute function jfl_private.enforce_social_chat_message_consent('team');
create trigger team_social_read_consent before insert or update on jfl.team_chat_reads
for each row execute function jfl_private.enforce_social_chat_read_consent('team');
create trigger league_social_message_consent before insert or update of season_id,author_player_id,body,client_message_id
on jfl.league_chat_messages for each row execute function jfl_private.enforce_social_chat_message_consent('general');
create trigger league_social_read_consent before insert or update on jfl.league_chat_reads
for each row execute function jfl_private.enforce_social_chat_read_consent('general');
revoke all on function jfl.get_social_chat_consent(uuid,text),jfl.set_social_chat_consent(uuid,text,boolean),
jfl_private.social_chat_enabled(uuid,text),jfl_private.lock_social_chat_consent(uuid,text),
jfl_private.lock_social_chat_preference_write(),jfl_private.require_social_chat_consent(uuid,text),
jfl_private.enforce_social_chat_message_consent(),jfl_private.enforce_social_chat_read_consent()
from public,anon,authenticated;
grant execute on function jfl.get_social_chat_consent(uuid,text),jfl.set_social_chat_consent(uuid,text,boolean),
jfl_private.social_chat_enabled(uuid,text),jfl_private.lock_social_chat_consent(uuid,text),
jfl_private.lock_social_chat_preference_write(),jfl_private.require_social_chat_consent(uuid,text),
jfl_private.enforce_social_chat_message_consent(),jfl_private.enforce_social_chat_read_consent()
to service_role;
CREATE OR REPLACE FUNCTION jfl.get_my_league_chat_inbox(actor_user_id uuid)
 RETURNS TABLE(season_id uuid, season_name text, last_message_body text, last_message_at timestamp with time zone, unread_count bigint, can_send boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  if not jfl_private.social_chat_enabled(actor_user_id,'general') then return; end if;
  select player.id into actor_player_id
  from jfl.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  return query
  with participant_seasons as (
    select season_player.season_id
    from jfl.season_players season_player
    where season_player.player_id = actor_player_id
      and season_player.status = 'active'
    union
    select membership.season_id
    from jfl.team_memberships membership
    where membership.player_id = actor_player_id
  )
  select season.id, season.name, latest.body, latest.created_at,
    count(unread.id)::bigint,
    jfl_private.is_active_season_participant(actor_player_id, season.id)
  from participant_seasons participant
  join jfl.seasons season on season.id = participant.season_id
  left join jfl.league_chat_reads read_state
    on read_state.season_id = season.id
    and read_state.player_id = actor_player_id
  left join lateral (
    select message.body, message.created_at
    from jfl.league_chat_messages message
    where message.season_id = season.id and message.removed_at is null
    order by message.created_at desc, message.id desc
    limit 1
  ) latest on true
  left join jfl.league_chat_messages unread
    on unread.season_id = season.id
    and unread.created_at > coalesce(read_state.last_read_at, season.created_at)
    and unread.author_player_id <> actor_player_id
    and unread.removed_at is null
  group by season.id, season.name, latest.body, latest.created_at
  order by
    jfl_private.is_active_season_participant(actor_player_id, season.id) desc,
    latest.created_at desc nulls last,
    season.created_at desc;
end;
$function$

CREATE OR REPLACE FUNCTION jfl.get_my_team_chat_inbox(actor_user_id uuid)
 RETURNS TABLE(team_id uuid, team_name text, season_id uuid, season_name text, member_role text, last_message_body text, last_message_at timestamp with time zone, unread_count bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  if not jfl_private.social_chat_enabled(actor_user_id,'team') then return; end if;
  select p.id into actor_player_id
  from jfl.players p
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
  from jfl.team_memberships tm
  join jfl.teams t on t.id = tm.team_id and t.season_id = tm.season_id
  join jfl.seasons s on s.id = tm.season_id
  left join jfl.team_chat_reads tcr
    on tcr.team_id = tm.team_id and tcr.player_id = actor_player_id
  left join lateral (
    select m.body, m.created_at
    from jfl.team_chat_messages m
    where m.team_id = tm.team_id
      and m.created_at >= tm.starts_at
      and m.removed_at is null
    order by m.created_at desc, m.id desc
    limit 1
  ) latest on true
  left join jfl.team_chat_messages unread
    on unread.team_id = tm.team_id
    and unread.created_at > coalesce(tcr.last_read_at, tm.starts_at)
    and unread.author_player_id <> actor_player_id
    and unread.removed_at is null
  where tm.player_id = actor_player_id
    and tm.ends_at is null
  group by t.id, t.name, s.id, s.name, tm.role, latest.body, latest.created_at
  order by latest.created_at desc nulls last, t.name;
end;
$function$

CREATE OR REPLACE FUNCTION jfl.list_league_chat_messages(actor_user_id uuid, target_season_id uuid, before_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, before_message_id uuid DEFAULT NULL::uuid, result_limit integer DEFAULT 50)
 RETURNS TABLE(message_id uuid, season_id uuid, author_player_id uuid, author_display_name text, body text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  if not jfl_private.social_chat_enabled(actor_user_id,'general') then
    raise exception 'Social chat unavailable' using errcode='42501';
  end if;
  if result_limit < 1 or result_limit > 100 then
    raise exception 'Message limit must be between 1 and 100';
  end if;
  select player.id into actor_player_id
  from jfl.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not jfl_private.is_season_chat_participant(actor_player_id, target_season_id) then
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
    from jfl.league_chat_messages message
    join jfl.players author on author.id = message.author_player_id
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
$function$

CREATE OR REPLACE FUNCTION jfl.list_team_chat_messages(actor_user_id uuid, target_team_id uuid, before_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, result_limit integer DEFAULT 50)
 RETURNS TABLE(message_id uuid, team_id uuid, author_player_id uuid, author_display_name text, body text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  if not jfl_private.social_chat_enabled(actor_user_id,'team') then
    raise exception 'Social chat unavailable' using errcode='42501';
  end if;
  if result_limit < 1 or result_limit > 100 then
    raise exception 'Message limit must be between 1 and 100';
  end if;

  if not exists (select 1 from jfl.teams t where t.id = target_team_id) then
    raise exception 'Team not found';
  end if;

  select p.id into actor_player_id
  from jfl.players p
  where p.user_id = actor_user_id;

  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  if not exists (
    select 1
    from jfl.team_memberships tm
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
    from jfl.team_chat_messages m
    join jfl.players author on author.id = m.author_player_id
    where m.team_id = target_team_id
      and m.removed_at is null
      and (before_created_at is null or m.created_at < before_created_at)
      and exists (
        select 1
        from jfl.team_memberships access_membership
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
$function$

CREATE OR REPLACE FUNCTION jfl.mark_league_chat_read(actor_user_id uuid, target_season_id uuid, read_through_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(season_id uuid, player_id uuid, last_read_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
begin
  perform jfl_private.require_social_chat_consent(actor_user_id,'general');
  select player.id into actor_player_id
  from jfl.players player
  where player.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not jfl_private.is_season_chat_participant(actor_player_id, target_season_id) then
    raise exception 'League chat access is required';
  end if;

  return query
  insert into jfl.league_chat_reads (season_id, player_id, last_read_at)
  values (target_season_id, actor_player_id, coalesce(read_through_at, clock_timestamp()))
  on conflict on constraint league_chat_reads_pkey
  do update set
    last_read_at = greatest(jfl.league_chat_reads.last_read_at, excluded.last_read_at),
    updated_at = clock_timestamp()
  returning jfl.league_chat_reads.season_id,
    jfl.league_chat_reads.player_id,
    jfl.league_chat_reads.last_read_at;
end;
$function$

CREATE OR REPLACE FUNCTION jfl.mark_team_chat_read(actor_user_id uuid, target_team_id uuid, read_through_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(team_id uuid, player_id uuid, last_read_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player_id uuid;
  target_season_id uuid;
  effective_read_at timestamptz := least(coalesce(read_through_at, now()), now());
begin
  perform jfl_private.require_social_chat_consent(actor_user_id,'team');
  select p.id into actor_player_id
  from jfl.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select tm.season_id into target_season_id
  from jfl.team_memberships tm
  where tm.team_id = target_team_id
    and tm.player_id = actor_player_id
    and tm.ends_at is null;
  if target_season_id is null then
    raise exception 'Active team membership is required to mark chat read';
  end if;

  insert into jfl.team_chat_reads (season_id, team_id, player_id, last_read_at)
  values (target_season_id, target_team_id, actor_player_id, effective_read_at)
  on conflict on constraint team_chat_reads_pkey
  do update set last_read_at = greatest(
    jfl.team_chat_reads.last_read_at,
    excluded.last_read_at
  );

  return query
  select read_state.team_id, read_state.player_id, read_state.last_read_at
  from jfl.team_chat_reads read_state
  where read_state.team_id = target_team_id
    and read_state.player_id = actor_player_id;
end;
$function$

CREATE OR REPLACE FUNCTION jfl.send_league_chat_message(actor_user_id uuid, target_season_id uuid, message_body text, message_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(message_id uuid, season_id uuid, author_player_id uuid, author_display_name text, body text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player jfl.players%rowtype;
  saved_message jfl.league_chat_messages%rowtype;
begin
  perform jfl_private.require_social_chat_consent(actor_user_id,'general');
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(message_body) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;
  select player.* into actor_player
  from jfl.players player
  where player.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;
  if not jfl_private.is_active_season_participant(actor_player.id, target_season_id) then
    raise exception 'Active season participation is required to post league messages';
  end if;

  insert into jfl.league_chat_messages (
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
$function$

CREATE OR REPLACE FUNCTION jfl.send_team_chat_message(actor_user_id uuid, target_team_id uuid, message_body text, message_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(message_id uuid, team_id uuid, author_player_id uuid, author_display_name text, body text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  actor_player jfl.players%rowtype;
  target_team jfl.teams%rowtype;
  saved_message jfl.team_chat_messages%rowtype;
begin
  perform jfl_private.require_social_chat_consent(actor_user_id,'team');
  message_body := btrim(message_body);
  if message_body is null or char_length(message_body) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(message_body) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;

  select p.* into actor_player
  from jfl.players p
  where p.user_id = actor_user_id;
  if actor_player.id is null then
    raise exception 'Player profile is required before using chat';
  end if;

  select t.* into target_team
  from jfl.teams t
  where t.id = target_team_id;
  if target_team.id is null then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from jfl.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player.id
      and tm.ends_at is null
  ) then
    raise exception 'Active team membership is required to post messages';
  end if;

  insert into jfl.team_chat_messages (
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
$function$

notify pgrst,'reload schema';
commit;
