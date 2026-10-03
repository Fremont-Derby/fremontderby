export function teamMissionLine(team = {}) {
  if (!team.name) return '';
  return `Team mission: understand ${team.name}.`;
}
export function launchLine(launch = {}) {
  if (!launch.name) return '';
  return `Launch: ${launch.name}.`;
}
