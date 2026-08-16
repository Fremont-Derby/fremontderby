-- #171 Defense-in-depth RLS on private operational tables.
-- No browser policies: anon/authenticated stay denied; service_role bypasses RLS.

do $$
declare
  t text;
  tables text[] := array[
    'audit_events',
    'free_agent_availability',
    'league_admins',
    'payment_status',
    'player_contacts',
    'player_match_score_submissions',
    'roster_availability',
    'team_invitations',
    'team_lineup_slots',
    'team_lineups',
    'team_trades',
    'player_competition_restrictions',
    'player_date_availability',
    'team_match_player_choices',
    'captaincy_transfers',
    'team_membership_requests',
    'player_trial_league_nights',
    'season_team_slots',
    'team_applications',
    'sandbox_feedback'
  ];
begin
  foreach t in array tables loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'private'
        and table_name = t
    ) then
      execute format('alter table private.%I enable row level security', t);
      execute format('revoke all on table private.%I from public, anon, authenticated', t);
      -- Ensure no permissive policies for browser roles exist.
      -- service_role continues to bypass RLS for Worker/RPC access.
    end if;
  end loop;
end
$$;

comment on schema private is
  'Private operational data. RLS enabled as defense-in-depth (#171); browser roles have no grants; Worker uses service_role RPCs only.';
