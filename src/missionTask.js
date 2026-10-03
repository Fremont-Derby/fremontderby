export function missionTaskLabel(mission) {
  return mission && mission.task ? mission.task : 'Mission needs a task, not a fixture name';
}
