-- When player_ratings rows are missing, dual-score was blocked ("Race targets are required").
-- Default provisional Fargo 500 and race 5/5 so generated player matches are scorable on beta.

create or replace function private.lock_player_match_ratings()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  rating_a public.player_ratings%rowtype;
  rating_b public.player_ratings%rowtype;
  rating_band public.season_race_chart_bands%rowtype;
  match_season public.seasons%rowtype;
  fargo_a integer;
  fargo_b integer;
  status_a text;
  status_b text;
begin
  select * into rating_a from public.player_ratings pr where pr.player_id = new.player_a_id;
  select * into rating_b from public.player_ratings pr where pr.player_id = new.player_b_id;
  select * into match_season from public.seasons s where s.id = new.season_id;

  fargo_a := coalesce(rating_a.fargo_rating, 500);
  fargo_b := coalesce(rating_b.fargo_rating, 500);
  status_a := coalesce(
    nullif(rating_a.rating_status, ''),
    case when rating_a.player_id is null then 'provisional' else rating_a.rating_status end,
    'provisional'
  );
  status_b := coalesce(
    nullif(rating_b.rating_status, ''),
    case when rating_b.player_id is null then 'provisional' else rating_b.rating_status end,
    'provisional'
  );

  new.player_a_fargo_rating := fargo_a;
  new.player_b_fargo_rating := fargo_b;
  new.player_a_rating_status := status_a;
  new.player_b_rating_status := status_b;
  new.opening_block_length := coalesce(match_season.opening_block_length, new.opening_block_length, 3);
  new.opening_discipline := coalesce(new.opening_discipline, '8-ball');
  new.current_discipline := coalesce(new.current_discipline, new.opening_discipline);
  new.first_break := coalesce(new.first_break, 'A');

  select * into rating_band
  from public.season_race_chart_bands band
  where band.season_id = new.season_id
    and abs(fargo_a - fargo_b) <= band.max_rating_diff
  order by band.max_rating_diff asc
  limit 1;

  if found then
    if fargo_a = fargo_b then
      new.race_to_a := rating_band.stronger_race_to;
      new.race_to_b := rating_band.stronger_race_to;
    elsif fargo_a > fargo_b then
      new.race_to_a := rating_band.stronger_race_to;
      new.race_to_b := rating_band.weaker_race_to;
    else
      new.race_to_a := rating_band.weaker_race_to;
      new.race_to_b := rating_band.stronger_race_to;
    end if;
  else
    new.race_to_a := coalesce(new.race_to_a, 5);
    new.race_to_b := coalesce(new.race_to_b, 5);
  end if;

  return new;
end;
$function$;
