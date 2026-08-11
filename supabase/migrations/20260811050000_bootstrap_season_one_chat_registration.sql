create or replace function private.auto_register_new_player_for_open_season()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  open_season_count integer;
  open_season_id uuid;
  fee_cents integer;
begin
  select count(*)
  into open_season_count
  from public.seasons season
  where season.status = 'registration';

  if open_season_count <> 1 then
    return new;
  end if;

  select season.id
  into open_season_id
  from public.seasons season
  where season.status = 'registration'
  order by season.created_at desc, season.id desc
  limit 1;

  insert into public.season_players (
    season_id, player_id, participation_type, status
  ) values (
    open_season_id, new.id, 'free_agent', 'active'
  )
  on conflict (season_id, player_id) do nothing;

  select coalesce(configuration.entry_fee_cents, 0)
  into fee_cents
  from public.season_prize_configurations configuration
  where configuration.season_id = open_season_id
  order by configuration.version desc
  limit 1;

  insert into private.payment_status (
    season_id, player_id, status, amount_due_cents, amount_paid_cents
  ) values (
    open_season_id, new.id, 'unpaid', coalesce(fee_cents, 0), 0
  )
  on conflict (season_id, player_id) do nothing;

  return new;
end;
$$;

revoke all on function private.auto_register_new_player_for_open_season()
  from public, anon, authenticated;
grant execute on function private.auto_register_new_player_for_open_season()
  to service_role;

drop trigger if exists players_auto_register_for_open_season on public.players;
create trigger players_auto_register_for_open_season
after insert on public.players
for each row execute function private.auto_register_new_player_for_open_season();

do $$
declare
  target_season_id uuid;
  open_season_count integer;
  fee_cents integer;
begin
  select count(*)
  into open_season_count
  from public.seasons season
  where season.status = 'registration';

  if open_season_count = 0 and not exists (select 1 from public.seasons) then
    insert into public.seasons (name, status)
    values ('Season 1', 'registration')
    returning id into target_season_id;
  elsif open_season_count = 1 then
    select season.id
    into target_season_id
    from public.seasons season
    where season.status = 'registration'
    order by season.created_at desc, season.id desc
    limit 1;
  else
    return;
  end if;

  insert into public.season_players (
    season_id, player_id, participation_type, status
  )
  select target_season_id, player.id, 'free_agent', 'active'
  from public.players player
  on conflict (season_id, player_id) do nothing;

  select coalesce(configuration.entry_fee_cents, 0)
  into fee_cents
  from public.season_prize_configurations configuration
  where configuration.season_id = target_season_id
  order by configuration.version desc
  limit 1;

  insert into private.payment_status (
    season_id, player_id, status, amount_due_cents, amount_paid_cents
  )
  select target_season_id, player.id, 'unpaid', coalesce(fee_cents, 0), 0
  from public.players player
  on conflict (season_id, player_id) do nothing;
end;
$$;

comment on function private.auto_register_new_player_for_open_season() is
  'Enrolls a newly created player profile as an unpaid free agent when exactly one season is accepting registration. Does nothing when registration is closed or ambiguous.';
