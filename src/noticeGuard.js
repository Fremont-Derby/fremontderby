export function dedupeNotices(list) {
  const seen = new Set();
  return (list || []).filter((notice) => {
    const key = notice.eventId || `${notice.title}|${notice.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function restoreProof(backup) {
  return { ok: Boolean(backup?.restored && backup?.served), text: backup?.served ? 'Backup restored and served.' : 'Backup has not been served.' };
}

export function writeState(state) {
  return { text: state === 'saved' ? 'Saved.' : state === 'failed' ? 'Failed. Try again.' : 'Saving.' };
}

export function tapTarget(size) {
  return { ok: size >= 44, text: size >= 44 ? 'Tap target is large enough.' : 'Tap target is too small.' };
}

export function roleBoundary(actor, action) {
  const allowed = actor?.role === 'admin' || action === 'read';
  return { ok: allowed, text: allowed ? 'Action is allowed.' : 'Action is outside this role.' };
}

export function launchReady(checks) {
  return { ok: (checks || []).every((check) => check.ok), text: 'Launch waits until every check is ok.' };
}

export function usabilityGap(page) {
  return { text: page?.label ? `${page.label} has a label.` : 'Name the control.' };
}
