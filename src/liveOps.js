export function allowlist(host) {
  return { ok: ['dru.fremontderby.com', 'gamma.fremontderby.com'].includes(host), text: host ? `${host} is named.` : 'Name the host.' };
}
export function personaEvidence(row) {
  return { ok: Boolean(row?.persona && row?.step && row?.result), text: 'Evidence needs a persona, a step, and a result.' };
}
export function releaseManifest(surface) {
  return { approved: Boolean(surface?.name && surface?.sha), text: surface?.name ? `${surface.name} is in the manifest.` : 'Name the surface.' };
}
export function failedGate(defect) {
  return { ok: Boolean(defect?.gate && defect?.test), text: defect?.gate ? `${defect.gate} failed at ${defect.test}.` : 'Name the gate and the test.' };
}
export function contrastState(state) {
  return { ok: ['open', 'selected', 'disabled'].includes(state), text: 'Menu state is open, selected, or disabled.' };
}
export function messageScroll(pane) {
  return { ok: pane?.overflow !== 'hidden', text: 'The message pane can scroll.' };
}
export function scheduleAfterSeason(season) {
  return { ok: Boolean(season?.id), text: season?.id ? 'Schedule can load for this season.' : 'Pick a season first.' };
}
export function diagnosticBundle(report) {
  return { ok: Boolean(report?.lane && report?.sha && report?.error), text: 'A bug report needs the lane, the SHA, and the error.' };
}
