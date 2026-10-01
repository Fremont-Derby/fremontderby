export function reportEvidence(report) {
  return { ok: Boolean(report?.id && report?.private !== true), text: report?.private ? 'Unrelated messages stay private.' : 'Evidence is limited to the report.' };
}
export function sessionLane(cookie) {
  return { ok: cookie?.lane === cookie?.host, text: cookie?.lane ? `Session is ${cookie.lane}.` : 'Name the session lane.' };
}
export function factSource(fact) {
  return { ok: Boolean(fact?.source), text: fact?.source ? `From ${fact.source}.` : 'Name the source.' };
}
export function destructiveAction(action) {
  return { ok: Boolean(action?.consequence), text: action?.consequence || 'Say what this deletes.' };
}
export function agingReview(feature) {
  return { due: (feature?.days || 0) >= 90, text: (feature?.days || 0) >= 90 ? 'Review this feature.' : 'Not due.' };
}
export function gateDefect(defect) {
  return { fails: defect?.blocking === true, text: defect?.blocking ? 'This defect fails the gate.' : 'Pass with a follow-up.' };
}
export function bindingInventory(env) {
  return { ok: Boolean(env?.name && (env?.bindings || []).length), text: env?.name ? `${env.name} lists its bindings.` : 'Name the environment.' };
}
export function workflowHealth(row) {
  return { ok: ['auth', 'teams', 'score', 'messages', 'admin'].includes(row?.workflow) && Boolean(row?.status), text: row?.status || 'Name the workflow status.' };
}
