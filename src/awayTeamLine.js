export function awayTeamLine(teamName) {
  const name = String(teamName || '').trim();
  return name ? `Away: ${name}` : 'Away team not set';
}
