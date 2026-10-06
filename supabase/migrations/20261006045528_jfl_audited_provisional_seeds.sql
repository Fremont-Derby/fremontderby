-- #3340: JFL-only explicit admin fallback, without activating new race rules
-- or rejecting existing match creation. Preserve existing source functions.
do $guard$
begin
  if md5(pg_get_functiondef('jfl_private.lock_player_match_ratings()'::regprocedure)) <> 'de76b1aefe307673dd2210166b3ae255'
    or md5(pg_get_functiondef('jfl_private.seed_provisional_player_rating()'::regprocedure)) <> '639e91e859b861509a51596436fb4247' then
    raise exception 'JFL seed contract drift; requalify before applying';
  end if;
  if to_regclass('jfl_private.admin_provisional_seed_events') is not null
    or to_regclass('jfl_private.current_admin_provisional_seeds') is not null then
    raise exception 'JFL seed provenance already exists; reconcile before applying';
  end if;
end;
$guard$;

create table jfl_private.admin_provisional_seed_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references jfl.players(id),
  actor_user_id uuid not null references auth.users(id),
  rating_value integer not null check (rating_value between 0 and 1000),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  previous_value integer,
  previous_status text,
  effective_at timestamptz not null default now()
);
create index admin_provisional_seed_events_player_time
  on jfl_private.admin_provisional_seed_events(player_id,effective_at desc,id);
alter table jfl_private.admin_provisional_seed_events enable row level security;
revoke all on jfl_private.admin_provisional_seed_events from public,anon,authenticated,service_role;
grant select on jfl_private.admin_provisional_seed_events to service_role;

-- Keep the current provenance pointer private; no new public rating columns.
create table jfl_private.current_admin_provisional_seeds (
  player_id uuid primary key references jfl.players(id),
  event_id uuid not null references jfl_private.admin_provisional_seed_events(id)
);
alter table jfl_private.current_admin_provisional_seeds enable row level security;
revoke all on jfl_private.current_admin_provisional_seeds from public,anon,authenticated,service_role;
grant select on jfl_private.current_admin_provisional_seeds to service_role;

create function jfl.get_admin_provisional_seed(actor_user_id uuid,target_player_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare rating jfl.player_ratings%rowtype; event jfl_private.admin_provisional_seed_events%rowtype; is_confirmed boolean;
begin
  if not exists(select 1 from jfl_private.league_admins a where a.user_id=actor_user_id) then
    raise exception 'Actor is not a league admin' using errcode='42501';
  end if;
  if not exists(select 1 from jfl.players p where p.id=target_player_id) then
    raise exception 'Player not found' using errcode='P0002';
  end if;
  select * into rating from jfl.player_ratings r where r.player_id=target_player_id;
  select e.* into event from jfl_private.admin_provisional_seed_events e
    join jfl_private.current_admin_provisional_seeds c on c.event_id=e.id
    where c.player_id=target_player_id and e.player_id=target_player_id;
  is_confirmed := event.id is not null and event.rating_value=rating.fargo_rating
    and event.effective_at=rating.updated_at and rating.rating_status='provisional';
  return jsonb_build_object('playerId',target_player_id,'ratingValue',rating.fargo_rating,
    'ratingStatus',rating.rating_status,'source',case
      when rating.fargo_rating is null then 'missing'
      when is_confirmed then 'admin_provisional'
      else 'unverified_legacy' end,
    'eventId',case when is_confirmed then event.id end,
    'reason',case when is_confirmed then event.reason end,
    'effectiveAt',case when is_confirmed then event.effective_at end);
end;
$function$;

create function jfl.record_admin_provisional_seed(actor_user_id uuid,target_player_id uuid,seed_value integer,seed_reason text)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare previous jfl.player_ratings%rowtype; event_id uuid; effective timestamptz;
begin
  if not exists(select 1 from jfl_private.league_admins a where a.user_id=actor_user_id) then
    raise exception 'Actor is not a league admin' using errcode='42501';
  end if;
  if seed_value is null or seed_value not between 0 and 1000 or seed_reason is null
    or char_length(btrim(seed_reason)) not between 1 and 500 then
    raise exception 'Valid rating and reason required' using errcode='22023';
  end if;
  -- Serialize same-player admin decisions, including when no rating row exists.
  perform p.id from jfl.players p where p.id=target_player_id for update;
  if not found then raise exception 'Player not found' using errcode='P0002'; end if;
  select * into previous from jfl.player_ratings r where r.player_id=target_player_id for update;
  if previous.rating_status='established' then
    raise exception 'Established seed cannot be replaced by provisional value' using errcode='23514';
  end if;
  effective := clock_timestamp();
  insert into jfl_private.admin_provisional_seed_events(player_id,actor_user_id,rating_value,reason,previous_value,previous_status,effective_at)
    values(target_player_id,actor_user_id,seed_value,btrim(seed_reason),previous.fargo_rating,previous.rating_status,effective)
    returning id into event_id;
  insert into jfl_private.current_admin_provisional_seeds(player_id,event_id)
    values(target_player_id,event_id)
    on conflict(player_id) do update set event_id=excluded.event_id;
  insert into jfl.player_ratings(player_id,fargo_rating,rating_status,updated_at)
    values(target_player_id,seed_value,'provisional',effective)
    on conflict(player_id) do update set fargo_rating=excluded.fargo_rating,rating_status=excluded.rating_status,updated_at=excluded.updated_at;
  -- No player_matches, racks, race bands or historical snapshot update.
  return jfl.get_admin_provisional_seed(actor_user_id,target_player_id);
end;
$function$;
revoke all on function jfl.get_admin_provisional_seed(uuid,uuid) from public,anon,authenticated;
revoke all on function jfl.record_admin_provisional_seed(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function jfl.get_admin_provisional_seed(uuid,uuid) to service_role;
grant execute on function jfl.record_admin_provisional_seed(uuid,uuid,integer,text) to service_role;
notify pgrst,'reload schema';
