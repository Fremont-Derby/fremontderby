export function stuckPathLabel(mission) {
  return mission && mission.stuck ? 'Leave this mission and start again' : 'Mission is not stuck';
}
