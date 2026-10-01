export function publicRead(call) {
  return { ok: !call?.writes, text: call?.writes ? 'A public read cannot write.' : 'Read is public.' };
}
export function backupRestore(backup) {
  return { ok: Boolean(backup?.taken && backup?.restored), text: backup?.restored ? 'Restore was rehearsed.' : 'Rehearse the restore.' };
}
export function migrationPair(from, to) {
  return { ok: Boolean(from && to && from !== to), text: from && to ? `Rehearse ${from} to ${to}.` : 'Name both states.' };
}
export function auditRow(row) {
  return { ok: Boolean(row?.actor && row?.action && row?.when), text: 'An audit row needs actor, action, and time.' };
}
export function piiAccess(row) {
  return { ok: Boolean(row?.who && row?.field && row?.why), text: 'Personal-data access needs who, field, and why.' };
}
export function retention(row) {
  return { ok: Boolean(row?.field && row?.days), text: row?.days ? `Keep ${row.field} for ${row.days} days.` : 'Name the retention.' };
}
export function secondTab(tabs) {
  return { ok: (tabs || []).every((tab) => tab.saved), text: 'A second tab must not overwrite an unsaved edit.' };
}
export function refreshSafe(page) {
  return { ok: page?.saved !== false, text: page?.saved === false ? 'Save before refresh.' : 'Refresh is safe.' };
}
