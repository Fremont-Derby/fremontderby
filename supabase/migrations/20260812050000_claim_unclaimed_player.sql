create or replace function public.get_player_claim_options(
  actor_user_id uuid,
  search_text text default null
)
returns table(options jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_search text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;

  if exists (
    select 1 from public.players owned where owned.user_id = actor_user_id
  ) then
    return query select jsonb_build_object(
      'canClaim', false,
      'reason', 'already_has_profile',
      'players', '[]'::jsonb
    );
    return;
  end if;

  cleaned_search := nullif(btrim(regexp_replace(coalesce(search_text, ''), '\s+', ' ', 'g')), '');

  return query
  select jsonb_build_object(
    'canClaim', true,
    'reason', null,
    'players', coalesce((
      select jsonb_agg(candidate order by candidate ->> 'displayName')
      from (
        select jsonb_build_object(
          'playerId', p.id,
          'displayName', p.display_name,
          'teamNames', coalesce((
            select jsonb_agg(team_name order by team_name)
            from (
              select distinct t.name as team_name
              from public.team_memberships tm
              join public.teams t on t.id = tm.team_id
              where tm.player_id = p.id
                and tm.ends_at is null
            ) team_names
          ), '[]'::jsonb),
          'seasonNames', coalesce((
            select jsonb_agg(season_name order by season_name)
            from (
              select distinct s.name as season_name
              from public.season_players sp
              join public.seasons s on s.id = sp.season_id
              where sp.player_id = p.id
                and sp.status = 'active'
            ) season_names
          ), '[]'::jsonb)
        ) as candidate
        from public.players p
        where p.user_id is null
          and (cleaned_search is null or p.display_name ilike '%' || cleaned_search || '%')
          and not exists (
            select 1
            from public.player_matches pm
            where (pm.player_a_id = p.id or pm.player_b_id = p.id)
              and (
                exists (
                  select 1
                  from public.player_match_racks rack
                  where rack.player_match_id = pm.id
                )
                or exists (
                  select 1
                  from private.player_match_score_submissions submission
                  where submission.player_match_id = pm.id
                    and jsonb_array_length(coalesce(submission.racks, '[]'::jsonb)) > 0
                )
              )
          )
        order by lower(p.display_name), p.created_at, p.id
        limit 30
      ) candidates
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.claim_unclaimed_player(
  actor_user_id uuid,
  target_player_id uuid
)
returns table(
  player_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player public.players%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'player_self_claim_actor:' || actor_user_id::text,
    0
  ));

  select * into target_player
  from public.players p
  where p.id = target_player_id
  for update;

  if not found then raise exception 'Player not found'; end if;
  if target_player.user_id is not null then
    raise exception 'Player is already claimed';
  end if;

  if exists (
    select 1 from public.players owned where owned.user_id = actor_user_id
  ) then
    raise exception 'You already have a player profile';
  end if;

  if exists (
    select 1
    from public.player_matches pm
    where (pm.player_a_id = target_player_id or pm.player_b_id = target_player_id)
      and (
        exists (
          select 1
          from public.player_match_racks rack
          where rack.player_match_id = pm.id
        )
        or exists (
          select 1
          from private.player_match_score_submissions submission
          where submission.player_match_id = pm.id
            and jsonb_array_length(coalesce(submission.racks, '[]'::jsonb)) > 0
        )
      )
  ) then
    raise exception 'Player has game history and cannot be self-claimed';
  end if;

  update public.players
  set user_id = actor_user_id,
      updated_at = now()
  where id = target_player_id;

  insert into private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'player.self_claim',
    'player',
    target_player_id,
    jsonb_build_object('hasLogin', false),
    jsonb_build_object('hasLogin', true)
  );

  return query
  select p.id, p.display_name
  from public.players p
  where p.id = target_player_id;
end;
$$;

revoke all on function public.get_player_claim_options(uuid, text)
  from public, anon, authenticated;
grant execute on function public.get_player_claim_options(uuid, text)
  to service_role;

revoke all on function public.claim_unclaimed_player(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_unclaimed_player(uuid, uuid)
  to service_role;

comment on function public.get_player_claim_options(uuid, text) is
  'Service-role-only claim discovery for signed-in users without a player profile. Returns only unclaimed players with zero competitive racks.';
comment on function public.claim_unclaimed_player(uuid, uuid) is
  'Service-role-only atomic self-claim. Rejects claimed players, users who already own a profile, and any player with competitive rack history.';
