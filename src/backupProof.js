const LANES = new Set(['dru', 'gamma', 'jfl']);

export function proveBackup({ lane, backup, served }) {
  if (!LANES.has(lane)) return { ok: false, reason: 'A restore proof stays off production.' };
  if (!String(backup || '').trim()) return { ok: false, reason: 'Name the backup.' };
  if (served !== true) return { ok: false, reason: 'Serve the restored lane before calling it proven.' };
  return { ok: true, lane, backup: String(backup).trim() };
}
