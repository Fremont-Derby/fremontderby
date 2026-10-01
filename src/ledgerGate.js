export function mobileShot(shot) {
  return { ok: shot?.width === 390 && Boolean(shot?.gate), text: shot?.gate ? `Shot for ${shot.gate}.` : 'Name the gate.' };
}
export function recoveryTarget(plan) {
  return { ok: Boolean(plan?.point && plan?.time), text: plan?.point ? `Recover to ${plan.point} within ${plan.time}.` : 'Name the point and the time.' };
}
export function tddEvidence(run) {
  return { ok: run?.red === true && run?.green === true, text: 'Show red, then green.' };
}
export function rackLedger(rack) {
  return { ok: Boolean(rack?.race && rack?.winner), text: rack?.winner ? `${rack.race} won by ${rack.winner}.` : 'Name the race and the winner.' };
}
export function chatRoom(room) {
  return { ok: ['direct', 'team', 'general'].includes(room), text: 'Chat is direct, team, or general.' };
}
export function playerSearch(query) {
  return { ok: Boolean(query?.text), text: query?.text ? `Search ${query.text}.` : 'Enter a name.' };
}
export function rulesGuide(rule) {
  return { ok: Boolean(rule?.title && rule?.short), text: rule?.title || 'Name the rule.' };
}
export function opsHub(page) {
  return { ok: Boolean(page?.health && page?.exceptions), text: 'The hub shows health and exceptions.' };
}
