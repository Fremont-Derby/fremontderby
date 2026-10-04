export function captainLinkLabel(team) {
  return team && team.captainName ? 'Message ' + team.captainName : 'No captain to message';
}
