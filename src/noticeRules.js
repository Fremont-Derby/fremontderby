const EVENTS = ['lineup-due', 'match-tonight', 'score-disputed'];

export function notificationEvents() {
  return EVENTS;
}

export function expireNotice(notice, now) {
  if (!notice?.until) return { active: true };
  return { active: notice.until > now, text: notice.until > now ? 'Still open.' : 'This notice has expired.' };
}

export function dedupeNotices(list) {
  const seen = new Set();
  return (list || []).filter((notice) => {
    const key = `${notice.event}|${notice.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function nightBudget(ms) {
  return { ok: ms <= 500, text: ms <= 500 ? 'Within the night budget.' : 'Over the 500ms night budget.' };
}

export function statusText(state) {
  const words = { ok: 'Ready', warn: 'Check this', bad: 'Blocked' };
  return { text: words[state] || 'Unknown', colorOnly: false };
}
