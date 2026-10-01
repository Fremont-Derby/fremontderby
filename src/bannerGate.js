export function expireNotice(notice) {
  return { open: notice?.done !== true, text: notice?.done ? 'Notice is resolved.' : 'Notice is still open.' };
}
export function statusBanner(banner) {
  return { shown: Boolean(banner?.text && banner?.until), text: banner?.text || 'Name the banner.' };
}
export function launchRunbook(step) {
  return { ok: Boolean(step?.name && step?.owner), text: step?.name ? `${step.name} is owned by ${step.owner}.` : 'Name the launch step.' };
}
export function latencyBudget(call) {
  return { ok: (call?.ms || 0) <= (call?.budget || 500), text: 'Call is inside the budget.' };
}
export function releaseDiff(diff) {
  return { ok: Boolean(diff?.files && diff?.risk), text: diff?.risk || 'Name the risk.' };
}
export function fourGateReview(batch) {
  return { due: (batch?.gates || 0) >= 4, text: (batch?.gates || 0) >= 4 ? 'Review the last four gates.' : 'Not due yet.' };
}
export function usabilityFinding(finding) {
  return { ok: Boolean(finding?.step && finding?.result), text: finding?.result || 'Record the step and the result.' };
}
export function mobileShot(shot) {
  return { ok: shot?.width === 390, text: 'Screenshot is 390 wide.' };
}
