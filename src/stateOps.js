export function leagueState(season) {
  if (season?.archived && season?.status === 'open') return { ok: false, text: 'An archived season cannot be open.' };
  return { ok: true, text: 'Season state is possible.' };
}

export function validationData(row) {
  return { real: false, text: row?.validation ? 'Validation data stays out of real standings.' : 'This row is real league data.' };
}

export function roleBoundary(actor, action) {
  if (action === 'manage' && actor?.role !== 'admin' && actor?.role !== 'captain') return { allowed: false, text: 'A player cannot manage the team.' };
  return { allowed: true, text: 'Action is allowed.' };
}

export function writeOnce(key, seen) {
  if (seen?.has(key)) return { saved: false, text: 'This write was already saved.' };
  return { saved: true, text: 'Write saved once.' };
}

export function gateRegression(gate) {
  return { passed: Boolean(gate?.passed), text: gate?.passed ? `${gate.name} still passes.` : `${gate?.name || 'Gate'} needs a regression check.` };
}
