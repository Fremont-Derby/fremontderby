create table private.league_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  note text
);

create table private.player_contacts (
  player_id uuid primary key references public.players(id) on delete cascade,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);

create table private.payment_status (
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'partial', 'paid', 'waived')),
  amount_due_cents integer not null default 0 check (amount_due_cents >= 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  updated_at timestamptz not null default now(),
  primary key (season_id, player_id)
);

revoke all on table private.league_admins from public, anon, authenticated;
revoke all on table private.player_contacts from public, anon, authenticated;
revoke all on table private.payment_status from public, anon, authenticated;
grant all on table private.league_admins, private.player_contacts, private.payment_status to service_role;

create or replace function private.is_league_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.league_admins la
    where la.user_id = (select auth.uid())
  );
$$;

create or replace function private.active_team_roster_count(target_team_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.team_memberships tm
  where tm.team_id = target_team_id
    and tm.ends_at is null;
$$;

revoke all on function private.is_league_admin() from public;
revoke all on function private.active_team_roster_count(uuid) from public;
grant execute on function private.is_league_admin() to authenticated;
grant execute on function private.active_team_roster_count(uuid) to authenticated;

grant update (ends_at) on public.team_memberships to authenticated;

create policy "Captains can add roster players to own team"
on public.team_memberships for insert
to authenticated
with check (
  role = 'player'
  and (select private.is_team_captain(team_id))
  and (select private.active_team_roster_count(team_id)) < 4
);

create policy "Captains can end roster player memberships on own team"
on public.team_memberships for update
to authenticated
using (
  role = 'player'
  and ends_at is null
  and (select private.is_team_captain(team_id))
)
with check (
  role = 'player'
  and ends_at is not null
  and (select private.is_team_captain(team_id))
);

comment on table private.league_admins is
  'Private league-admin authority list. Trusted Worker commands use this role; browser roles cannot read or mutate it.';

comment on table private.player_contacts is
  'Private player contact details. Public profile data stays in public.players.';

comment on table private.payment_status is
  'Private per-player payment status. Aggregate prize and purse data belongs in public read models.';

comment on function private.is_league_admin() is
  'Returns whether the authenticated Supabase user has league-admin authority.';
