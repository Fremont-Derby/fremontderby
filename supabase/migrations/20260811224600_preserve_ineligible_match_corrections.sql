drop trigger if exists legacy_match_racks_competition_eligibility on public.player_match_racks;

comment on function private.reject_ineligible_score_advance() is
  'Blocks increases to team-scoped dual-score rack histories for restricted players. Canonical rack correction remains available to league admins.';
