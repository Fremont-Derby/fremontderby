-- Ensure every new player gets a provisional rating row so race charts / UI have a baseline.
-- lock_player_match_ratings already defaults missing ratings at match insert; this keeps directory/admin consistent.

create or replace function private.seed_provisional_player_rating()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.player_ratings (player_id, fargo_rating, rating_status)
  values (new.id, 500, 'provisional')
  on conflict (player_id) do nothing;
  return new;
end;
$function$;

drop trigger if exists seed_provisional_player_rating_after_insert on public.players;
create trigger seed_provisional_player_rating_after_insert
  after insert on public.players
  for each row
  execute function private.seed_provisional_player_rating();
