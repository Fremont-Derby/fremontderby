export function captainLine(teamName, captainName) {
  const team = String(teamName || '').trim() || 'Team';
  const captain = String(captainName || '').trim();
  return captain ? `${team} captain: ${captain}` : `${team} captain: not set`;
}
