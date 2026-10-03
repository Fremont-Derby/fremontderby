-- #2886 Lane-aware admin phone save. Audit stores readiness only, never the number.
create or replace function dru.set_admin_player_phone(
  actor_user_id uuid,
  target_player_id uuid,
  profile_phone text
)
returns table(phone text, has_phone boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_phone text;
  digit_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if not exists (select 1 from private.league_admins la where la.user_id = actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if not exists (select 1 from dru.players p where p.id = target_player_id) then
    raise exception 'Player profile is required';
  end if;
  normalized_phone := nullif(btrim(profile_phone), '');
  if normalized_phone is not null then
    digit_count := char_length(regexp_replace(normalized_phone, '[^0-9]', '', 'g'));
    if digit_count < 10 or digit_count > 15 then
      raise exception 'Phone number must contain between 10 and 15 digits';
    end if;
  end if;
  insert into private.player_contacts(player_id, phone, updated_at)
  values(target_player_id, normalized_phone, now())
  on conflict (player_id) do update
    set phone = excluded.phone, updated_at = now();
  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (actor_user_id, 'player.phone_contact_update', 'player', target_player_id, jsonb_build_object('hasPhone', normalized_phone is not null));
  return query select normalized_phone, normalized_phone is not null;
end;
$$;

revoke all on function dru.set_admin_player_phone(uuid, uuid, text) from public, anon, authenticated;
grant execute on function dru.set_admin_player_phone(uuid, uuid, text) to service_role;

comment on function dru.set_admin_player_phone(uuid, uuid, text) is
  'DRU admin phone save. Audit stores hasPhone only. Browser roles cannot execute it.';
