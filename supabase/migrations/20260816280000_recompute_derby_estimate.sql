-- #86 Persist Derby estimate snapshots via existing observation model.

create or replace function public.recompute_derby_estimate_for_player(
  actor_user_id uuid,
  target_player_id uuid,
  prior_rating integer default 500,
  prior_strength numeric default 4
)
returns public.rating_observations
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_admin boolean;
  edge record;
  weight_sum numeric := 0;
  rating_mass numeric := 0;
  win_mass numeric := 0;
  mean_opp numeric;
  win_rate numeric;
  raw numeric;
  est integer;
  conf text;
  evidence_count integer := 0;
  inserted public.rating_observations%rowtype;
  player_ext text;
begin
  if actor_user_id is null or target_player_id is null then
    raise exception 'actor_user_id and target_player_id are required';
  end if;
  select exists(select 1 from private.league_admins la where la.user_id = actor_user_id) into is_admin;
  if not is_admin then
    raise exception 'Actor is not a league admin';
  end if;

  -- Collect edges: Open matches where this player's fremont_open or fargo external id appears
  for edge in
    with ids as (
      select external_id, provider
      from public.player_external_identities
      where player_id = target_player_id
      union
      select p.fargo_external_id, 'fargo'
      from public.players p
      where p.id = target_player_id and p.fargo_external_id is not null
    ),
    open_edges as (
      select
        case when m.winner_external_id in (select external_id from ids) then true else false end as won,
        case
          when m.winner_external_id in (select external_id from ids) then m.loser_external_id
          else m.winner_external_id
        end as opp_ext,
        case
          when m.racks_won_winner is not null and m.racks_won_loser is not null
            then least(8.0, greatest(1.0, (m.racks_won_winner + m.racks_won_loser) / 3.0))
          else 0.6
        end as weight
      from public.external_tournament_matches m
      where m.winner_external_id in (select external_id from ids)
         or m.loser_external_id in (select external_id from ids)
    )
    select
      oe.won,
      oe.weight,
      coalesce(
        (select pr.fargo_rating
         from public.player_external_identities pei
         join public.player_ratings pr on pr.player_id = pei.player_id
         where pei.external_id = oe.opp_ext
         order by pr.updated_at desc nulls last
         limit 1),
        500
      ) as opp_rating
    from open_edges oe
  loop
    evidence_count := evidence_count + 1;
    weight_sum := weight_sum + edge.weight;
    rating_mass := rating_mass + edge.opp_rating * edge.weight;
    if edge.won then win_mass := win_mass + edge.weight; end if;
  end loop;

  if weight_sum <= 0 then
    est := coalesce(prior_rating, 500);
    conf := 'low';
    mean_opp := est;
    win_rate := 0.5;
  else
    mean_opp := rating_mass / weight_sum;
    win_rate := win_mass / weight_sum;
    raw := mean_opp + (win_rate - 0.5) * 80;
    est := round(least(1000, greatest(0,
      (raw * weight_sum + coalesce(prior_rating, 500) * coalesce(prior_strength, 4))
      / (weight_sum + coalesce(prior_strength, 4))
    )))::integer;
    conf := case when weight_sum >= 12 then 'high' when weight_sum >= 5 then 'medium' else 'low' end;
  end if;

  insert into public.rating_observations (
    player_id, source_kind, rating_value, robustness, confidence, provenance, recorded_by
  ) values (
    target_player_id,
    'derby_estimate',
    est,
    null,
    conf,
    jsonb_build_object(
      'version', 'derby-estimate-v1',
      'method', 'anchored_wl_v1',
      'evidenceCount', evidence_count,
      'effectiveWeight', weight_sum,
      'winRate', win_rate,
      'meanOpponent', mean_opp,
      'prior', prior_rating
    ),
    actor_user_id
  ) returning * into inserted;

  perform private.apply_latest_rating_observation(target_player_id);

  insert into private.audit_events (actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'rating.recompute_derby_estimate',
    'player',
    target_player_id,
    jsonb_build_object('observationId', inserted.id, 'rating', est, 'confidence', conf, 'evidenceCount', evidence_count)
  );

  return inserted;
end;
$$;

revoke all on function public.recompute_derby_estimate_for_player(uuid, uuid, integer, numeric)
  from public, anon, authenticated;
grant execute on function public.recompute_derby_estimate_for_player(uuid, uuid, integer, numeric)
  to service_role;
