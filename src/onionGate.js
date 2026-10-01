export function rackEntry(rack) {
  return { ok: Boolean(rack?.winner && rack?.confirmed), text: rack?.confirmed ? 'Rack is confirmed.' : 'Confirm the rack.' };
}
export function noticeAction(notice) {
  return { ok: Boolean(notice?.title && notice?.action), text: notice?.action || 'Give the notice one action.' };
}
export function playerDetail(player) {
  return { ok: Boolean(player?.name && player?.eligibility), text: player?.eligibility || 'Say why the player is eligible.' };
}
export function payoutSummary(prize) {
  return { ok: Boolean(prize?.name && prize?.amount != null), text: prize?.name ? `${prize.name} pays ${prize.amount}.` : 'Name the prize.' };
}
export function seasonSetup(step) {
  return { ok: Boolean(step?.name && step?.next), text: step?.next || 'Name the next setup step.' };
}
export function playerSearch(query) {
  return { ok: Boolean(query?.text), text: query?.text ? `Search ${query.text}.` : 'Enter a name.' };
}
export function opsHealth(check) {
  return { ok: Boolean(check?.name && check?.status), text: check?.status || 'Name the health status.' };
}
export function seasonLifecycle(season) {
  return { ok: ['draft', 'open', 'published', 'final'].includes(season?.status), text: season?.status || 'Name the season status.' };
}
