drop index if exists private.one_lineup_player_per_round;

create unique index if not exists one_lineup_player_per_team_match
  on private.team_lineup_slots (lineup_id, player_id)
  where player_id is not null;

create or replace function private.enforce_regular_season_player_match_cap()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_stage text;
  existing_appearances integer;
begin
  if new.player_id is null then
    return new;
  end if;

  select r.stage
    into target_stage
  from public.rounds r
  where r.id = new.round_id;

  if target_stage is distinct from 'regular' then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.season_id::text || ':' || new.player_id::text, 0)
  );

  select count(*)::integer
    into existing_appearances
  from private.team_lineup_slots tls
  join public.rounds r on r.id = tls.round_id
  where tls.season_id = new.season_id
    and tls.player_id = new.player_id
    and r.stage = 'regular'
    and not (
      tls.lineup_id = new.lineup_id
      and tls.slot_number = new.slot_number
    );

  if existing_appearances >= 7 then
    raise exception 'Player cannot be scheduled for more than seven regular-season matches';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_regular_season_player_match_cap
  on private.team_lineup_slots;

create trigger enforce_regular_season_player_match_cap
before insert or update of season_id, round_id, player_id
on private.team_lineup_slots
for each row
execute function private.enforce_regular_season_player_match_cap();

do $migration$
declare
  definition text;
  rewritten text;
  obsolete_guard text := $needle$  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    join private.team_lineup_slots tls
      on tls.round_id = target_round_id
     and tls.player_id = parsed_slots.player_id
    where tls.team_id <> target_team_id
  ) then
    raise exception 'Player is already scheduled for another team in this round';
  end if;

$needle$;
begin
  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'submit_team_lineup'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'submit_team_lineup function not found';
  end if;

  rewritten := replace(definition, obsolete_guard, '');

  if rewritten = definition then
    raise exception 'obsolete cross-team round guard was not found';
  end if;

  execute rewritten;
end;
$migration$;
