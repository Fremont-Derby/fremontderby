alter table public.player_matches
  add column if not exists player_a_fargo_rating integer check (player_a_fargo_rating between 0 and 1000),
  add column if not exists player_b_fargo_rating integer check (player_b_fargo_rating between 0 and 1000),
  add column if not exists player_a_rating_status text
    check (player_a_rating_status in ('unverified', 'provisional', 'established')),
  add column if not exists player_b_rating_status text
    check (player_b_rating_status in ('unverified', 'provisional', 'established'));

create or replace function private.lock_player_match_ratings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rating_a public.player_ratings%rowtype;
  rating_b public.player_ratings%rowtype;
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

  return new;
end;
$$;

revoke all on function private.lock_player_match_ratings() from public;

create trigger lock_player_match_ratings_before_insert
before insert on public.player_matches
for each row execute function private.lock_player_match_ratings();

comment on column public.player_matches.player_a_fargo_rating is
  'Locked Fargo rating for player A when the individual match row is created.';

comment on column public.player_matches.player_b_fargo_rating is
  'Locked Fargo rating for player B when the individual match row is created.';

comment on function private.lock_player_match_ratings() is
  'Locks current public rating values onto generated player matches so later rating changes do not alter scorecards.';
