export function launchRunbook() {
  return ['Open the season', 'Check the teams', 'Score the match', 'Close the night'];
}

export function noticeLink(notice) {
  if (!notice?.href) return { href: '/schedule', text: 'This notice opens the schedule.' };
  return { href: notice.href, text: `This notice opens ${notice.href}.` };
}

export function writeState(state) {
  const words = { pending: 'Saving', saved: 'Saved', failed: 'Not saved' };
  return { text: words[state] || 'Unknown' };
}

export function tapTarget(control) {
  return { ok: (control?.size || 0) >= 44, text: (control?.size || 0) >= 44 ? 'Tap target is large enough.' : 'Tap target is too small.' };
}

export function nightFallback(down) {
  return { mode: down ? 'read-only' : 'live', text: down ? 'League night is read-only until scoring returns.' : 'League night is live.' };
}
