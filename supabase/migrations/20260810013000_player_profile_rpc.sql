create or replace function public.upsert_player_profile(
  actor_user_id uuid,
  profile_display_name text
)
returns table (
  id uuid,
  user_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_display_name text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  normalized_display_name := btrim(profile_display_name);
  if normalized_display_name is null or char_length(normalized_display_name) = 0 then
    raise exception 'display_name is required';
  end if;

  if char_length(normalized_display_name) > 80 then
    raise exception 'display_name must be 80 characters or fewer';
  end if;

  return query
  insert into public.players (
    user_id,
    display_name
  ) values (
    actor_user_id,
    normalized_display_name
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now()
  returning
    players.id,
    players.user_id,
    players.display_name;
end;
$$;

revoke all on function public.upsert_player_profile(uuid, text)
  from public, anon, authenticated;
grant execute on function public.upsert_player_profile(uuid, text)
  to service_role;

comment on function public.upsert_player_profile(uuid, text) is
  'Service-role-only profile self-service boundary. The Worker passes the authenticated actor user id; only display_name is mutable.';
