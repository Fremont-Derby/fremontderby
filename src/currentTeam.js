export function currentTeams(teams) {
  return (teams || []).filter((team) => !team?.endsAt && !team?.ends_at);
}
