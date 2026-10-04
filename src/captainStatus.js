export function captainStatusLabel(team) {
  return team && team.captainName ? 'Captain: ' + team.captainName : 'Captain is missing';
}
