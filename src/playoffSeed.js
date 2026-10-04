export function playoffSeedLine(seed, teamName) {
  const team = String(teamName || '').trim() || 'Team';
  const n = Number(seed) || 0;
  return n ? `Seed ${n}: ${team}` : team;
}
