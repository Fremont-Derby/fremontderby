create table public.season_race_chart_bands (
  season_id uuid not null references public.seasons(id) on delete cascade,
  max_rating_diff integer not null check (max_rating_diff >= 0),
  stronger_race_to integer not null check (stronger_race_to > 0),
  weaker_race_to integer not null check (weaker_race_to > 0),
  created_at timestamptz not null default now(),
  primary key (season_id, max_rating_diff)
);

alter table public.season_race_chart_bands enable row level security;

grant select on public.season_race_chart_bands to anon, authenticated;
grant all on public.season_race_chart_bands to service_role;

create policy "Race chart bands are publicly readable"
on public.season_race_chart_bands for select
to anon, authenticated
using (true);

alter table public.player_matches
  add column if not exists race_to_a integer check (race_to_a > 0),
  add column if not exists race_to_b integer check (race_to_b > 0);

create or replace function private.lock_player_match_ratings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rating_a public.player_ratings%rowtype;
  rating_b public.player_ratings%rowtype;
  rating_band public.season_race_chart_bands%rowtype;
begin
  select *
    into rating_a
  from public.player_ratings pr
  where pr.player_id = new.player_a_id;

  select *
    into rating_b
  from public.player_ratings pr
  where pr.player_id = new.player_b_id;

  new.player_a_fargo_rating := rating_a.fargo_rating;
  new.player_b_fargo_rating := rating_b.fargo_rating;
  new.player_a_rating_status := rating_a.rating_status;
  new.player_b_rating_status := rating_b.rating_status;

  if rating_a.fargo_rating is not null and rating_b.fargo_rating is not null then
    select *
      into rating_band
    from public.season_race_chart_bands band
    where band.season_id = new.season_id
      and abs(rating_a.fargo_rating - rating_b.fargo_rating) <= band.max_rating_diff
    order by band.max_rating_diff asc
    limit 1;

    if found then
      if rating_a.fargo_rating = rating_b.fargo_rating then
        new.race_to_a := rating_band.stronger_race_to;
        new.race_to_b := rating_band.stronger_race_to;
      elsif rating_a.fargo_rating > rating_b.fargo_rating then
        new.race_to_a := rating_band.stronger_race_to;
        new.race_to_b := rating_band.weaker_race_to;
      else
        new.race_to_a := rating_band.weaker_race_to;
        new.race_to_b := rating_band.stronger_race_to;
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on table public.season_race_chart_bands is
  'Configurable per-season Fargo race chart bands. Trusted setup writes bands; scorecards may read them.';

comment on column public.player_matches.race_to_a is
  'Locked race target for player A calculated from the season race chart when the match row is created.';

comment on column public.player_matches.race_to_b is
  'Locked race target for player B calculated from the season race chart when the match row is created.';
