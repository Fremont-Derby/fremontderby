export function convergenceGate(row) {
  return { ok: Boolean(row?.lane && row?.sha && row?.peer), text: row?.peer ? 'Ready for Gamma review.' : 'Needs a peer before Gamma.' };
}
export function personaSelector(env) {
  return { ok: env?.lane !== 'prod', text: 'Persona selector stays off production.' };
}
export function phoneFormat(phone) {
  return { ok: /^\d{10}$/.test(phone || ''), text: 'Phone is ten digits.' };
}
export function qualification(player) {
  return { ok: (player?.matches || 0) >= (player?.needed || 1), text: `${player?.matches || 0} of ${player?.needed || 1} matches.` };
}
export function profileRetest(check) {
  return { ok: Boolean(check?.sha && check?.human), text: check?.human ? 'Human retest is recorded.' : 'Human retest is still open.' };
}
export function participationMatch(row) {
  return { ok: row?.checkedIn === row?.eligible, text: row?.checkedIn === row?.eligible ? 'Check-in matches eligibility.' : 'Check-in and eligibility disagree.' };
}
export function dateStatus(row) {
  return { ok: Boolean(row?.date && row?.status), text: row?.status || 'Name the date status.' };
}
export function statusTable(rows) {
  return { ok: (rows || []).every((row) => row.status), text: 'Every row names a status.' };
}
