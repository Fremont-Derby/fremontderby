export function reversibleGate(gate) {
  return { ok: Boolean(gate?.undo), text: gate?.undo ? 'Gate can be undone.' : 'Name the undo.' };
}
export function roleBoundary(actor, action) {
  return { ok: actor?.role === 'admin' || action?.public === true, text: 'Role does not allow this action.' };
}
export function tapTarget(control) {
  return { ok: (control?.size || 0) >= 44, text: 'Tap target is at least 44.' };
}
export function writeState(write) {
  return { ok: ['pending', 'saved', 'failed'].includes(write?.state), text: write?.state || 'Name pending, saved, or failed.' };
}
export function sessionExpired(session) {
  return { recover: session?.expired === true, text: session?.expired ? 'Sign in again. The draft is kept.' : 'Session is current.' };
}
export function testerFeedback(note) {
  return { ok: Boolean(note?.lane && note?.sha && note?.text), text: 'Feedback needs the lane, the SHA, and the note.' };
}
export function captainPhone(viewer, phone) {
  return { shown: viewer?.role === 'admin' && Boolean(phone), text: viewer?.role === 'admin' ? 'Admin can see the phone.' : 'Phone is hidden.' };
}
export function noticeEvent(event) {
  return { notify: ['lineup', 'score', 'checkin'].includes(event), text: 'Only lineup, score, and check-in create a notice.' };
}
