create or replace function public.get_own_player_phone(actor_user_id uuid)
returns table(
  phone text,
  has_phone boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pc.phone,
    nullif(btrim(pc.phone), '') is not null as has_phone
  from public.players p
  left join private.player_contacts pc on pc.player_id = p.id
  where p.user_id = actor_user_id
  limit 1;
$$;

create or replace function public.set_own_player_phone(
  actor_user_id uuid,
  profile_phone text
)
returns table(
  phone text,
  has_phone boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player_id uuid;
  normalized_phone text;
  digit_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;

  select p.id into target_player_id
  from public.players p
  where p.user_id = actor_user_id
  for update;
  if not found then raise exception 'Player profile is required'; end if;

  normalized_phone := nullif(btrim(profile_phone), '');
  if normalized_phone is not null then
    digit_count := char_length(regexp_replace(normalized_phone, '[^0-9]', '', 'g'));
    if digit_count < 10 or digit_count > 15 then
      raise exception 'Phone number must contain between 10 and 15 digits';
    end if;
  end if;

  if normalized_phone is null and exists (
    select 1
    from public.team_memberships tm
    join public.seasons s on s.id = tm.season_id
    where tm.player_id = target_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
      and s.status in ('active', 'playoffs')
  ) then
    raise exception 'Active captains must keep a phone number on file';
  end if;

  insert into private.player_contacts(player_id, phone, updated_at)
  values(target_player_id, normalized_phone, now())
  on conflict (player_id) do update
    set phone = excluded.phone,
        updated_at = now();

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'player.phone_contact_update',
    'player',
    target_player_id,
    jsonb_build_object('hasPhone', normalized_phone is not null)
  );

  return query select normalized_phone, normalized_phone is not null;
end;
$$;

create or replace function public.list_admin_player_contact_readiness(actor_user_id uuid)
returns table(
  player_id uuid,
  has_phone boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  return query
  select p.id, nullif(btrim(pc.phone), '') is not null
  from public.players p
  left join private.player_contacts pc on pc.player_id = p.id;
end;
$$;

create or replace function public.get_admin_player_phone(
  actor_user_id uuid,
  target_player_id uuid
)
returns table(
  player_id uuid,
  display_name text,
  phone text,
  has_phone boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  return query
  select p.id, p.display_name, pc.phone, nullif(btrim(pc.phone), '') is not null
  from public.players p
  left join private.player_contacts pc on pc.player_id = p.id
  where p.id = target_player_id;
end;
$$;

revoke all on function public.get_own_player_phone(uuid) from public, anon, authenticated;
revoke all on function public.set_own_player_phone(uuid, text) from public, anon, authenticated;
revoke all on function public.list_admin_player_contact_readiness(uuid) from public, anon, authenticated;
revoke all on function public.get_admin_player_phone(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_own_player_phone(uuid) to service_role;
grant execute on function public.set_own_player_phone(uuid, text) to service_role;
grant execute on function public.list_admin_player_contact_readiness(uuid) to service_role;
grant execute on function public.get_admin_player_phone(uuid, uuid) to service_role;

comment on function public.get_own_player_phone(uuid) is
  'Service-role-only read of the authenticated player own private phone contact.';
comment on function public.set_own_player_phone(uuid, text) is
  'Service-role-only update of the authenticated player own private phone contact; audit history records readiness only, never the phone value.';
comment on function public.list_admin_player_contact_readiness(uuid) is
  'Service-role-only league-admin contact readiness list; broad results expose only whether a phone exists.';
comment on function public.get_admin_player_phone(uuid, uuid) is
  'Service-role-only league-admin detail read of one player private phone contact.';
