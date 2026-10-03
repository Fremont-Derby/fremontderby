export function lineupTeamStatus(teamName, state) {
  const name = String(teamName || '').trim();
  if (!name) return '';
  return `${name} lineup is ${state || 'open'}.`;
}
