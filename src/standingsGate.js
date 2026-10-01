export function privilegedChange(change) {
  return { ok: Boolean(change?.actor && change?.when && change?.reason && change?.before && change?.after), text: 'A privileged change needs actor, time, reason, before, and after.' };
}
export function recompute(matches) {
  const wins = {};
  for (const match of matches || []) {
    if (!match.final) continue;
    wins[match.winner] = (wins[match.winner] || 0) + 1;
  }
  return wins;
}
export function rulesVersion(season) {
  return { ok: Boolean(season?.rules), text: season?.rules ? `Governed by ${season.rules}.` : 'Tag the rules version.' };
}
export function archiveSeason(season) {
  return { ok: season?.status === 'final' && Boolean(season?.archived), text: 'A completed season is archived.' };
}
export function deployOrder(step) {
  return { ok: step?.schemaBeforeApp === true, text: 'Schema deploys before the app.' };
}
export function regressionCheck(gate) {
  return { ok: Boolean(gate?.passed && gate?.fixture), text: 'A passed gate needs a synthetic fixture.' };
}
export function criticalWrite(write) {
  return { ok: Boolean(write?.idempotent), text: write?.idempotent ? 'Retry is safe.' : 'Retry could double-write.' };
}
export function onionDone(page) {
  return { ok: Boolean(page?.shell && page?.task && page?.readable), text: page?.task || 'Name the page task.' };
}
