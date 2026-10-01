export function backupRestore(backup) {
  return { ok: Boolean(backup?.taken && backup?.restored && backup?.served), text: backup?.served ? 'Restore was served.' : 'Rehearse the restore and serve it.' };
}
export function dedupeNotice(list) {
  const seen = new Set();
  return (list || []).filter((notice) => {
    const key = `${notice.title}|${notice.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function noticeLink(link) {
  return { href: link?.current || '/schedule', text: link?.current ? 'Open the current state.' : 'Fall back to the schedule.' };
}
