export function noticeState(notice) {
  if (!notice?.title) return null;
  return { title: notice.title, state: notice.done ? 'done' : 'open', text: notice.done ? `${notice.title} is handled.` : notice.title };
}

export function captainPhone(viewer, phone) {
  if (viewer?.role !== 'admin') return { visible: false, text: 'Captain phone numbers are admin-only.' };
  return { visible: true, text: phone };
}

export function readOnlyMode(enabled) {
  return { writes: !enabled, text: enabled ? 'The league is read-only.' : 'Writes are allowed.' };
}

export function releaseReady(gates) {
  const failed = (gates || []).filter((gate) => !gate.ok);
  return { ready: failed.length === 0, text: failed.length ? `${failed[0].name} is not ready.` : 'Release checks passed.' };
}

export function rackWin(match, rack) {
  if (!rack?.winner) return match;
  const next = { ...match, score: { ...(match.score || {}) } };
  next.score[rack.winner] = (next.score[rack.winner] || 0) + 1;
  next.unlocked = true;
  return next;
}
