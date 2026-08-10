create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  stage text not null default 'regular'
    check (stage in ('regular', 'semifinal', 'championship', 'tiebreaker')),
  scheduled_on date,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'finalized', 'corrected')),
  created_at timestamptz not null default now(),
  unique (season_id, stage, round_number),
  unique (id, season_id)
);

create table public.team_matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null,
  round_id uuid not null,
  table_number integer not null check (table_number > 0),
  team_a_id uuid not null,
  team_b_id uuid not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'lineups_due', 'in_progress', 'finalized', 'corrected')),
  winner_team_id uuid,
  created_at timestamptz not null default now(),
  check (team_a_id <> team_b_id),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (team_a_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  foreign key (team_b_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  foreign key (winner_team_id, season_id)
    references public.teams(id, season_id)
    on delete set null,
  unique (round_id, table_number)
);

create unique index team_matches_unique_pair_per_round
  on public.team_matches (round_id, least(team_a_id, team_b_id), greatest(team_a_id, team_b_id));

alter table public.rounds enable row level security;
alter table public.team_matches enable row level security;

grant select on public.rounds, public.team_matches to anon, authenticated;
grant all on public.rounds, public.team_matches to service_role;

create policy "Rounds are publicly readable"
on public.rounds for select
to anon, authenticated
using (true);

create policy "Team matches are publicly readable"
on public.team_matches for select
to anon, authenticated
using (true);

comment on table public.rounds is
  'Published regular-season and postseason rounds. Browser roles can read; trusted Worker commands publish or correct.';

comment on table public.team_matches is
  'Team pairings for a round with table assignment. Player match generation happens from submitted lineups.';
