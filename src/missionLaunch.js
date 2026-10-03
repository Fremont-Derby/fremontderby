export function missionLaunchLine(mission = {}) {
  if (!mission.name) return '';
  return `Launch ${mission.name}.`;
}
export function testerPathLine(path = {}) {
  if (path.preview) return '';
  return 'Tester path: play the mission.';
}
