export function mockSeason(season) {
  return { ok: Boolean(season?.name && season?.simple), text: season?.simple ? 'Mock season is simple.' : 'Simplify the mock season.' };
}
export function finalScore(match) {
  return { shown: Boolean(match?.final && match?.score), text: match?.score || 'Show the final score.' };
}
export function playerResult(row) {
  return { ok: Boolean(row?.player && row?.points != null), text: row?.player ? `${row.player}: ${row.points}.` : 'Name the player and the points.' };
}
export function laneBase(branch) {
  return { ok: Boolean(branch?.base && branch?.lane), text: branch?.base ? `${branch.lane} bases on ${branch.base}.` : 'Name the lane base.' };
}
export function canaryCheck(check) {
  return { ok: Boolean(check?.name && check?.status === 200), text: check?.name ? `${check.name} is ${check.status}.` : 'Name the failed check.' };
}
export function matchComplete(match) {
  return { done: Boolean(match?.won && match?.racks), text: match?.won ? 'Match is complete. No extra rack.' : 'Match is still open.' };
}
export function shippingBlocker(blocker) {
  return { named: Boolean(blocker?.lane && blocker?.why), text: blocker?.why || 'Name the blocker.' };
}
export function closeKeyword(word) {
  return { ok: ['close', 'closes', 'closed'].includes(word), text: 'Use close, closes, or closed.' };
}
