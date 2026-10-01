export function operatorRunbook(night) {
  return { ok: Boolean(night?.runbook && night?.product), text: 'A new operator needs the product and the runbook.' };
}
export function antiSpam(message) {
  return { ok: (message?.count || 0) <= 5, text: (message?.count || 0) > 5 ? 'Slow down.' : 'Message allowed.' };
}
export function hardDelete(entity) {
  return { allowed: !entity?.history, text: entity?.history ? 'History cannot be deleted.' : 'No history. Delete allowed.' };
}
export function ruleDecision(rule) {
  return { ok: Boolean(rule?.decision && rule?.impact), text: rule?.decision || 'Record the decision and the impact.' };
}
export function humanIntervention(event) {
  return { counted: Boolean(event?.why), text: event?.why || 'Say why a human was needed.' };
}
export function hesitation(step) {
  return { flagged: (step?.attempts || 0) > 2, text: (step?.attempts || 0) > 2 ? 'Repeated attempt. Show the next action.' : 'Attempt is fine.' };
}
export function registrationDrop(player) {
  return { drop: Boolean(player?.expired), text: player?.expired ? 'Expired registration is dropped.' : 'Registration is current.' };
}
export function sharedShell(page) {
  return { ok: Boolean(page?.nav && page?.title), text: 'Keep the shared nav and title.' };
}
