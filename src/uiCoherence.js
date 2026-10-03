export function leftoverPage(name) {
  return { text: `${name || 'This page'} still uses the old layout. Open the schedule.` };
}

export function fargoReport({ fargoId }) {
  if (!fargoId) return { text: 'A Fargo id is missing. Add it, then record the match.' };
  return { text: 'This match can be recorded for Fargo.' };
}
