create or replace function public.admin_create_unclaimed_player(
  actor_user_id uuid,
  target_display_name text,
  allow_exact_duplicate boolean default false
)
returns table(
  player_id uuid,
  display_name text,
  has_login boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_name text;
  normalized_name text;
  created_player_id uuid;
  existing_name text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  cleaned_name := btrim(regexp_replace(coalesce(target_display_name, ''), '\s+', ' ', 'g'));
  if char_length(cleaned_name) < 1 then raise exception 'Player name is required'; end if;
  if char_length(cleaned_name) > 80 then raise exception 'Player name must be 80 characters or fewer'; end if;
  normalized_name := lower(cleaned_name);

  select p.display_name into existing_name
  from public.players p
  where lower(btrim(regexp_replace(p.display_name, '\s+', ' ', 'g'))) = normalized_name
  order by p.created_at, p.id
  limit 1;

  if existing_name is not null and not allow_exact_duplicate then
    raise exception 'A player named "%" already exists. Use the existing player or explicitly confirm a duplicate.', existing_name;
  end if;

  insert into public.players(user_id, display_name)
  values (null, cleaned_name)
  returning id into created_player_id;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'player.admin_create',
    'player',
    created_player_id,
    jsonb_build_object(
      'displayName', cleaned_name,
      'hasLogin', false,
      'explicitDuplicateOverride', allow_exact_duplicate
    )
  );

  return query
  select created_player_id, cleaned_name, false;
end;
$$;

revoke all on function public.admin_create_unclaimed_player(uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_create_unclaimed_player(uuid, text, boolean)
  to service_role;

comment on function public.admin_create_unclaimed_player(uuid, text, boolean) is
  'Service-role-only audited league-admin player creation. Creates an unclaimed player identity without an auth account or email.';
