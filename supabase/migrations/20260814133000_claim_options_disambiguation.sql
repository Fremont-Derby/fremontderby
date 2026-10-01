-- Enrich claim picker rows so same display names can be told apart.
create or replace function public.get_player_claim_options(
  actor_user_id uuid,
  search_text text default null
)
returns table(
  options jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_search text := nullif(btrim(coalesce(search_text, '')), '');
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if actor_player_id is not null then
    return query
    select jsonb_build_object(
      'canClaim', false,
      'reason', 'You already have a linked player profile.',
      'players', '[]'::jsonb
    );
    return;
  end if;

  return query
  select jsonb_build_object(
    'canClaim', true,
    'reason', null,
    'players', coalesce((
      select jsonb_agg(candidate order by lower(candidate->>'displayName'), candidate->>'playerId')
      from (
        select jsonb_build_object(
          'playerId', p.id,
          'displayName', p.display_name,
          'createdAt', p.created_at,
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
          ), '[]'::jsonb),
          'registrationStatus', (
            select sp.registration_status
            from public.season_players sp
            join public.seasons s on s.id = sp.season_id
            where sp.player_id = p.id
              and sp.status = 'active'
            order by s.created_at desc nulls last
            limit 1
          ),
          'paymentStatus', (
            select sp.payment_status
            from public.season_players sp
            join public.seasons s on s.id = sp.season_id
            where sp.player_id = p.id
              and sp.status = 'active'
            order by s.created_at desc nulls last
            limit 1
          )
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
