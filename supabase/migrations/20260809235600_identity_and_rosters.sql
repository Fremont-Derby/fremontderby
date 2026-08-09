create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_ratings (
  player_id uuid primary key references public.players(id) on delete cascade,
  fargo_rating integer check (fargo_rating between 0 and 1000),
  rating_status text not null default 'unverified'
    check (rating_status in ('unverified', 'provisional', 'established')),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'registration', 'active', 'playoffs', 'complete')),
  roster_lock_round integer,
  opening_block_length integer not null default 3 check (opening_block_length > 0),
  individual_min_matches integer not null default 5 check (individual_min_matches > 0),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (season_id, name)
);

create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role text not null default 'player' check (role in ('player', 'captain')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);

create unique index one_active_team_membership_per_player
  on public.team_memberships (player_id)
  where ends_at is null;

create index team_memberships_team_active_idx
  on public.team_memberships (team_id, ends_at);

create index players_user_id_idx on public.players (user_id);

create or replace function private.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.players p
  where p.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_team_captain(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_memberships tm
    join public.players p on p.id = tm.player_id
    where tm.team_id = target_team_id
      and tm.role = 'captain'
      and tm.ends_at is null
      and p.user_id = (select auth.uid())
  );
$$;

revoke all on function private.current_player_id() from public;
revoke all on function private.is_team_captain(uuid) from public;
grant execute on function private.current_player_id() to authenticated;
grant execute on function private.is_team_captain(uuid) to authenticated;

alter table public.players enable row level security;
alter table public.player_ratings enable row level security;
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;

grant select on public.players, public.player_ratings, public.seasons, public.teams, public.team_memberships to anon, authenticated;
grant insert, update on public.players to authenticated;
grant insert, update on public.teams to authenticated;
grant insert on public.team_memberships to authenticated;
grant all on public.players, public.player_ratings, public.seasons, public.teams, public.team_memberships to service_role;

create policy "Players are publicly readable"
on public.players for select
to anon, authenticated
using (true);

create policy "Users create their own player profile"
on public.players for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users update their own player profile"
on public.players for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Ratings are publicly readable"
on public.player_ratings for select
to anon, authenticated
using (true);

create policy "Seasons are publicly readable"
on public.seasons for select
to anon, authenticated
using (true);

create policy "Teams are publicly readable"
on public.teams for select
to anon, authenticated
using (true);

create policy "Authenticated users can create teams"
on public.teams for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "Captains can update their team"
on public.teams for update
to authenticated
using ((select private.is_team_captain(id)))
with check ((select private.is_team_captain(id)));

create policy "Memberships are publicly readable"
on public.team_memberships for select
to anon, authenticated
using (true);

create policy "Team creator can bootstrap own captain membership"
on public.team_memberships for insert
to authenticated
with check (
  role = 'captain'
  and player_id = (select private.current_player_id())
  and exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.created_by = (select auth.uid())
  )
);

comment on table public.player_ratings is
  'Ratings are public read-only to browser roles; trusted server/service-role operations own rating changes.';

comment on table public.team_memberships is
  'Membership history is time-bounded. Normal invite, trade, removal, and roster exception writes go through trusted server commands.';
