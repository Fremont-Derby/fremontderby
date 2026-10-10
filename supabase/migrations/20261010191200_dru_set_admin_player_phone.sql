-- #2886: DRU-only admin phone save. Does not touch other schemas.
-- Phone value stays in dru_private.player_contacts. Audit stores hasPhone only.

create or replace function dru.set_admin_player_phone(
  actor_user_id uuid,
  target_player_id uuid,
  profile_phone text
)
returns table(
  player_id uuid,
  display_name text,
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
  saved_name text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if not exists (
    select 1 from dru_private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select p.display_name into saved_name
  from dru.players p
  where p.id = target_player_id
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
    from dru.team_memberships tm
    join dru.seasons s on s.id = tm.season_id
    where tm.player_id = target_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
      and s.status in ('active', 'playoffs')
  ) then
    raise exception 'Active captains must keep a phone number on file';
  end if;

  insert into dru_private.player_contacts(player_id, phone, updated_at)
  values(target_player_id, normalized_phone, now())
  on conflict (player_id) do update
    set phone = excluded.phone,
        updated_at = now();

  insert into dru_private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'player.admin_phone_contact_update',
    'player',
    target_player_id,
    jsonb_build_object('hasPhone', normalized_phone is not null)
  );

  return query select target_player_id, saved_name, normalized_phone, normalized_phone is not null;
end;
$$;

revoke all on function dru.set_admin_player_phone(uuid, uuid, text) from public, anon, authenticated;
grant execute on function dru.set_admin_player_phone(uuid, uuid, text) to service_role;

comment on function dru.set_admin_player_phone(uuid, uuid, text) is
  'Service-role-only league-admin update of one player private phone. Audit stores hasPhone only, never the phone value.';
