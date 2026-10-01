export function lineupLock(home, away) {
  const both = Boolean(home?.submitted && away?.submitted);
  return { locked: both, text: both ? 'Both captains submitted. Lineup is locked.' : `${away?.submitted ? 'Home' : 'Away'} has not submitted.` };
}

export function functionalHealth(check) {
  return { ok: Boolean(check?.data), text: check?.data ? `${check.name} has data.` : `${check?.name || 'Check'} is shell only.` };
}

export function migrationRehearsal(from, to) {
  return { ok: Boolean(from && to && from !== to), text: from && to ? `Rehearse ${from} to ${to}.` : 'Name both schema states.' };
}

export function seasonFieldLock(season, field) {
  if (season?.status === 'open' && field === 'name') return { locked: true, text: 'Season name locks after open.' };
  return { locked: false, text: 'Field can still change.' };
}

export function replaySeason(matches) {
  const wins = {};
  for (const match of matches || []) wins[match.winner] = (wins[match.winner] || 0) + 1;
  return wins;
}
