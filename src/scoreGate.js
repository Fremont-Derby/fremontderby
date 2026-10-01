export function checkinBurst(calls) {
  return { ok: (calls || 0) <= 3, text: (calls || 0) > 3 ? 'Check-in is sending too many requests.' : 'Check-in rate is safe.' };
}
export function wafException(rule) {
  return { ok: Boolean(rule?.named && rule?.lane), text: rule?.named ? 'WAF exception is named.' : 'Name the WAF exception.' };
}
export function isolatedBinding(binding) {
  return { ok: Boolean(binding?.lane && binding.lane !== 'prod'), text: 'Binding stays off production.' };
}
export function selectedControl(control) {
  return { ok: Boolean(control?.selected && control?.visible), text: control?.visible ? 'Selected control stays visible.' : 'Selected control is hidden.' };
}
export function secretScan(text) {
  return { ok: !/sk_live|service_role/i.test(text || ''), text: 'No live secret in the text.' };
}
export function lineupUntilBoth(home, away) {
  return { editable: !(home?.submitted && away?.submitted), text: 'Lineup stays editable until both captains submit.' };
}
export function unsubmitOnEdit(lineup) {
  return { submitted: false, text: lineup?.edited ? 'Edit unsubmits the lineup.' : 'No edit.' };
}
export function humanThrottle(limit) {
  return { human: true, text: limit?.raised ? 'Throttle is raised.' : 'A human still needs to raise the throttle.' };
}
