export function homeTeamLine(teamName) {
  const name = String(teamName || '').trim();
  return name ? `Home: ${name}` : 'Home team not set';
}
