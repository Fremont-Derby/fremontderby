export function publicShell(page) {
  return { ok: Boolean(page?.home && page?.rules && page?.nav), text: 'Home, rules, and nav are present.' };
}
export function signedIn(profile) {
  return { ok: Boolean(profile?.name && profile?.signedIn), text: profile?.name || 'Sign in.' };
}
export function draftSeason(season) {
  return { ok: season?.status === 'draft' && Boolean(season?.name), text: 'Draft season is named.' };
}
export function registration(player) {
  return { ok: ['paid', 'unpaid', 'waived'].includes(player?.payment), text: player?.payment || 'Name the payment.' };
}
export function teamInvite(invite) {
  return { ok: Boolean(invite?.team && invite?.player), text: 'Name the team and the player.' };
}
export function publishedSchedule(schedule) {
  return { ok: schedule?.teams === 8 && schedule?.rounds === 7, text: 'Schedule is 8 teams and 7 rounds.' };
}
export function blindLineup(lineup) {
  return { ok: (lineup?.players || []).length === 3 && lineup?.blind === true, text: 'Lineup is three players and blind.' };
}
export function liveScore(score) {
  return { ok: Boolean(score?.home && score?.away), text: score?.mismatch ? 'Scores disagree.' : 'Both teams scored.' };
}
