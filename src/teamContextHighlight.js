export function isRequestedTeam(team, requested) {
  const target = String(requested || '').trim().toLowerCase();
  if (!target) return false;
  const ids = [team?.id, team?.team_id, team?.teamId, team?.name, team?.team_name, team?.teamName]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  return ids.includes(target);
}

export function teamContextSummary(team = {}) {
  const captain = String(team.captainName || team.captain_name || team.captain || '').trim();
  const season = String(team.seasonName || team.season_name || team.season || '').trim();
  const roster = Array.isArray(team.roster) ? team.roster.filter(Boolean) : [];
  return {
    teamName: String(team.name || team.team_name || team.teamName || '').trim(),
    captainName: captain,
    seasonName: season,
    rosterCount: roster.length,
    hasCaptain: Boolean(captain),
    hasSeason: Boolean(season),
  };
}
