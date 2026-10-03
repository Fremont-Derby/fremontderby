export function lineupMissLine(check = {}) {
  const teams = Array.isArray(check.captainTeams) ? check.captainTeams : [];
  const checked = new Set(check.checkedTeams || []);
  const allChecked = teams.length > 0 && teams.every((team) => checked.has(team));
  if (!allChecked) return '';
  if (check.matchFound) return '';
  return 'This match is not on your teams.';
}
