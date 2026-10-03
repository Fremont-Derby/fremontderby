export function missionIdentityLabel(mission) {
  return mission && mission.playerName ? mission.playerName + ' is playing' : 'Mission needs a player name';
}
