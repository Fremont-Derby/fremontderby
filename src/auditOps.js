export function archiveSeason(season) {
  if (season?.status !== 'completed' && season?.status !== 'validation') return { archived: false, text: 'Only a completed or validation season can be archived.' };
  return { archived: true, text: `${season.name} is archived.` };
}

export function recomputeStandings(matches) {
  const table = {};
  for (const match of matches || []) {
    if (!match.final) continue;
    table[match.winner] = (table[match.winner] || 0) + 1;
  }
  return table;
}

export function auditChange(change) {
  if (!change?.actor || !change?.at || !change?.reason || !change?.before || !change?.after) return null;
  return { text: `${change.actor} changed this at ${change.at}: ${change.reason}` };
}

export function recoveryDrill(failure) {
  const drills = { 'score-stuck': 'Enter the score by hand.', 'schedule-empty': 'Pick the season again.' };
  return { step: drills[failure] || 'Stop and record the failure.' };
}

export function releaseManifest(surface) {
  return { approved: Boolean(surface?.name), text: surface?.name ? `${surface.name} is on the release list.` : 'This surface is not on the release list.' };
}
