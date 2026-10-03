export function leagueAdmin({ viewerLeague, targetLeague }) {
  if (!viewerLeague) return { ok: false, text: 'Sign in on Profile, then open your league.' };
  if (viewerLeague !== targetLeague) return { ok: false, text: 'This league is outside your admin scope.' };
  return { ok: true, text: 'Admin tools are limited to your league.' };
}

export function opsEmpty() {
  return { text: 'No exceptions yet. Open the schedule, then come back.' };
}
