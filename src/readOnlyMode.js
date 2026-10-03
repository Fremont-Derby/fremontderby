export function readOnlyMode({ enabled, reason }) {
  if (!enabled) return { open: true, text: 'Writes are open.' };
  const why = reason ? ` ${reason}.` : '';
  return { open: false, text: `The lane is read-only.${why} Refresh later, then try the save again.` };
}

export function captainPhone({ viewer }) {
  if (viewer === 'admin') return { show: true, text: 'Admin can see the captain phone.' };
  return { show: false, text: 'Captain phone is hidden.' };
}
