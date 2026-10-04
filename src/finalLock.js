export function finalLock({ status, viewer }) {
  if (status === 'finalized' && viewer !== 'admin') return { ok: false, text: 'A finalized result cannot be edited. Ask an admin if it is wrong.' };
  if (status === 'finalized') return { ok: true, text: 'An admin can correct a finalized result with a reason.' };
  return { ok: true, text: 'This result can still be edited.' };
}

export function releaseReady(gates) {
  const open = (gates || []).filter((gate) => !gate.passed);
  if (open.length) return { ok: false, text: `Not ready. ${open[0].name || 'A gate'} is still open.` };
  return { ok: true, text: 'Every named gate has passed.' };
}
