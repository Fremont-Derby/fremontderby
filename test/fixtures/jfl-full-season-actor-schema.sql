-- Minimal local PG fixture; captured JFL trigger bodies, PG17.6 qualification 2026-10-27.
create schema auth;
create schema jfl;
create schema jfl_private;
create schema gamma;
create table auth.users(id uuid primary key,aud text,role text,email text unique,encrypted_password text,phone text,email_confirmed_at timestamptz,phone_confirmed_at timestamptz,last_sign_in_at timestamptz,deleted_at timestamptz,banned_until timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz);
create table auth.identities(id uuid primary key,user_id uuid references auth.users);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
create table jfl.players(id uuid primary key,user_id uuid unique references auth.users,display_name text);
create table gamma.players(id uuid primary key,user_id uuid);
create table jfl.seasons(id uuid primary key,purpose text,status text,created_at timestamptz default now());
create table jfl.season_players(season_id uuid,player_id uuid,participation_type text,status text,primary key(season_id,player_id));
create table jfl.player_ratings(player_id uuid primary key references jfl.players,fargo_rating numeric,rating_status text);
create table jfl.season_prize_configurations(season_id uuid,version integer,entry_fee_cents integer);
create table jfl_private.payment_status(season_id uuid,player_id uuid,status text,amount_due_cents integer,amount_paid_cents integer,primary key(season_id,player_id));
create table jfl_private.player_contacts(player_id uuid primary key references jfl.players,phone text);
create table jfl_private.league_admins(user_id uuid primary key);
CREATE OR REPLACE FUNCTION jfl_private.auto_register_new_player_for_open_season()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  open_season_count integer;
  open_season_id uuid;
  fee_cents integer;
begin
  select count(*)
  into open_season_count
  from jfl.seasons season
  where season.status = 'registration';

  if open_season_count <> 1 then
    return new;
  end if;

  select season.id
  into open_season_id
  from jfl.seasons season
  where season.status = 'registration'
  order by season.created_at desc, season.id desc
  limit 1;

  insert into jfl.season_players (
    season_id, player_id, participation_type, status
  ) values (
    open_season_id, new.id, 'free_agent', 'active'
  )
  on conflict (season_id, player_id) do nothing;

  select coalesce(configuration.entry_fee_cents, 0)
  into fee_cents
  from jfl.season_prize_configurations configuration
  where configuration.season_id = open_season_id
  order by configuration.version desc
  limit 1;

  insert into jfl_private.payment_status (
    season_id, player_id, status, amount_due_cents, amount_paid_cents
  ) values (
    open_season_id, new.id, 'unpaid', coalesce(fee_cents, 0), 0
  )
  on conflict (season_id, player_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION jfl_private.seed_provisional_player_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into jfl.player_ratings (player_id, fargo_rating, rating_status)
  values (new.id, 500, 'provisional')
  on conflict (player_id) do nothing;
  return new;
end;
$function$;

create trigger players_auto_register_for_open_season after insert on jfl.players for each row execute function jfl_private.auto_register_new_player_for_open_season();
create trigger seed_provisional_player_rating_after_insert after insert on jfl.players for each row execute function jfl_private.seed_provisional_player_rating();
insert into jfl.seasons(id,purpose,status) values('18580000-1000-4000-8000-000000000000','qa','active');

