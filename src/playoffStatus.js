export function playoffStatusLabel(team) {
  return team && team.inPlayoffs ? 'In the playoffs' : 'Not in the playoffs';
}
