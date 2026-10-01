export function rosterAssign(team, player) {
  return { ok: Boolean(team?.id && player?.id && player?.eligible), text: player?.eligible ? `${player.id} can join ${team.id}.` : 'Player is not eligible.' };
}
export function moderationQueue(report) {
  return { ok: Boolean(report?.id && report?.status), text: report?.status || 'Name the review status.' };
}
export function auditEvent(event) {
  return { ok: Boolean(event?.actor && event?.action && event?.when), text: 'An audit event needs actor, action, and time.' };
}
export function coherenceAudit(page) {
  return { ok: Boolean(page?.shell && page?.legacy === false), text: page?.legacy ? 'Legacy shell is still on.' : 'Shell is coherent.' };
}
export function bindingTest(env) {
  return { ok: Boolean(env?.name && env?.durable), text: env?.durable ? `${env.name} uses durable bindings.` : 'Bindings are not durable.' };
}
export function publicSmoke(check) {
  return { ok: check?.status === 200 && !check?.writes, text: check?.writes ? 'Public smoke wrote.' : 'Public smoke is a read.' };
}
export function healthHandoff(row) {
  return { ok: Boolean(row?.lane && row?.status), text: row?.status || 'Name the health status.' };
}
export function releaseTrain(train) {
  return { ok: Boolean(train?.peer && train?.lane), text: train?.peer ? 'Peer reviewed before Gamma.' : 'Needs a peer review.' };
}
