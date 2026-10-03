export function missionIdentityLine(mission = {}) {
  if (!mission.name) return '';
  return `Mission: ${mission.name}.`;
}
export function stuckPathLine(path = {}) {
  if (!path.stuck) return '';
  return 'Stuck: open Profile, then try the mission again.';
}
