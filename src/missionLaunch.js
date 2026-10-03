export function missionLaunchLabel(mission) {
  return mission && mission.title ? 'Start ' + mission.title : 'Mission needs a plain title';
}
