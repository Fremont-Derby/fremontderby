-- Service-role demo seed helpers: phone contacts and team chat without auth users.
-- Intended for operator seed scripts only; not exposed to anon/authenticated.

create or replace function public.admin_seed_player_phone(
  actor_user_id uuid,
  target_player_id uuid,
  profile_phone text
)
returns table(
  player_id uuid,
  phone text,
  has_phone boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_phone text;
  digit_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if not exists (select 1 from public.players p where p.id = target_player_id) then
    raise exception 'Player not found';
  end if;

  normalized_phone := nullif(btrim(profile_phone), '');
  if normalized_phone is not null then
    digit_count := char_length(regexp_replace(normalized_phone, '[^0-9]', '', 'g'));
    if digit_count < 10 or digit_count > 15 then
      raise exception 'Phone number must contain between 10 and 15 digits';
    end if;
  end if;

  insert into private.player_contacts(player_id, phone, updated_at)
  values (target_player_id, normalized_phone, now())
  on conflict (player_id) do update
    set phone = excluded.phone,
        updated_at = now();

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'player.admin_seed_phone',
    'player',
    target_player_id,
    jsonb_build_object('hasPhone', normalized_phone is not null)
  );

  return query
  select target_player_id, normalized_phone, normalized_phone is not null;
end;
$$;

revoke all on function public.admin_seed_player_phone(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_seed_player_phone(uuid, uuid, text)
  to service_role;

create or replace function public.admin_seed_team_chat_message(
  actor_user_id uuid,
  target_team_id uuid,
  author_player_id uuid,
  message_body text
)
returns table(
  message_id uuid,
  team_id uuid,
  author_player_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_team public.teams%rowtype;
  cleaned text;
  saved public.team_chat_messages%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  cleaned := btrim(message_body);
  if cleaned is null or char_length(cleaned) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(cleaned) > 2000 then
    raise exception 'Message cannot exceed 2000 characters';
  end if;

  select * into target_team from public.teams t where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = author_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Author must be an active member of the team';
  end if;

  insert into public.team_chat_messages (
    season_id, team_id, author_player_id, body
  ) values (
    target_team.season_id, target_team.id, author_player_id, cleaned
  )
  returning * into saved;

  return query
  select saved.id, saved.team_id, saved.author_player_id, saved.body, saved.created_at;
end;
$$;

revoke all on function public.admin_seed_team_chat_message(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_seed_team_chat_message(uuid, uuid, uuid, text)
  to service_role;
