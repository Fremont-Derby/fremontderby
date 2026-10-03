export function missionCompletionLine(mission = {}) {
  if (!mission.name || !mission.done) return '';
  return `${mission.name} is complete.`;
}
export function teamContextLine(team = {}) {
  if (!team.name || !team.role) return '';
  return `Team ${team.name}: you are ${team.role}.`;
}
