export function missionAbortLabel(mission) {
  return mission && mission.started ? 'Abort this mission' : 'No mission to abort';
}
