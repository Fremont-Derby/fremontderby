export function staleWrite({ revision, current, retry }) {
  if (revision && current && revision !== current) return { ok: false, text: 'This page is out of date. Refresh, then try the save again.' };
  if (retry) return { ok: true, text: 'Retry uses the same save. It does not add a second result.' };
  return { ok: true, text: 'Save can proceed.' };
}

export function impossibleState({ status, racks }) {
  if (status === 'scheduled' && racks > 0) return { ok: false, text: 'A scheduled race cannot already have racks.' };
  if (status === 'finalized' && racks === 0) return { ok: false, text: 'A finalized race needs at least one rack.' };
  return { ok: true, text: 'Race state is possible.' };
}
