export function tradeTeams(teams) {
  return (teams || []).filter((team) => team && (team.teamId || team.id) && (team.teamName || team.name));
}
