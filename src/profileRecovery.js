export function profileRecovery(status) {
  if (status === 401 || status === 403) return { tone: 'sign-in', text: 'Sign in on Profile, then come back.' };
  if (status >= 500) return { tone: 'edge', text: 'Profile did not load. Refresh, then try again.' };
  return { tone: 'ready', text: 'Profile loaded.' };
}

export function logLine(event) {
  const safe = { action: event.action || 'unknown', lane: event.lane || 'unknown' };
  return JSON.stringify(safe);
}
