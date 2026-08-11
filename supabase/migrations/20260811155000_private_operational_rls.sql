-- Defense in depth for private operational state.
-- Browser roles already have no direct table privileges; keep that boundary explicit
-- while enabling RLS so future grant drift cannot silently expose these tables.

alter table private.audit_events enable row level security;
alter table private.free_agent_availability enable row level security;
alter table private.league_admins enable row level security;
alter table private.payment_status enable row level security;
alter table private.player_contacts enable row level security;
alter table private.player_match_score_submissions enable row level security;
alter table private.roster_availability enable row level security;
alter table private.team_invitations enable row level security;
alter table private.team_lineup_slots enable row level security;
alter table private.team_lineups enable row level security;
alter table private.team_trades enable row level security;

revoke all on private.audit_events from public, anon, authenticated;
revoke all on private.free_agent_availability from public, anon, authenticated;
revoke all on private.league_admins from public, anon, authenticated;
revoke all on private.payment_status from public, anon, authenticated;
revoke all on private.player_contacts from public, anon, authenticated;
revoke all on private.player_match_score_submissions from public, anon, authenticated;
revoke all on private.roster_availability from public, anon, authenticated;
revoke all on private.team_invitations from public, anon, authenticated;
revoke all on private.team_lineup_slots from public, anon, authenticated;
revoke all on private.team_lineups from public, anon, authenticated;
revoke all on private.team_trades from public, anon, authenticated;

-- No browser policies are intentionally added. Trusted Worker/RPC flows continue to
-- operate with service_role while ordinary browser roles remain denied by grants + RLS.
