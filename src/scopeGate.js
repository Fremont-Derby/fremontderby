export function leagueAdmin(actor, league) {
  return { ok: actor?.role === 'admin' && actor?.league === league, text: 'An admin can change only their own league.' };
}
export function functionalSmoke(check) {
  return { ok: Boolean(check?.data), text: check?.data ? 'Functional data is present.' : 'Shell-only smoke is not enough.' };
}
export function sharedShell(page) {
  return { ok: Boolean(page?.nav && page?.title), text: 'Keep the shared nav and title.' };
}
export function cloneDrift(row) {
  return { drifted: row?.staging !== row?.prod, text: row?.staging === row?.prod ? 'Staging matches prod.' : 'Staging drifted.' };
}
export function standingsMode(mode) {
  return { ok: ['team', 'player'].includes(mode), text: mode ? `Mode is ${mode}.` : 'Show the standings mode.' };
}
export function oneCaptain(actor) {
  return { ok: (actor?.captainOf || []).length <= 1, text: 'One captaincy at a time.' };
}
export function onionPage(page) {
  return { ok: Boolean(page?.shell && page?.task), text: page?.task || 'Name the page task.' };
}
export function visibleState(state) {
  return { ok: Boolean(state?.label), text: state?.label || 'Show the state in words.' };
}
