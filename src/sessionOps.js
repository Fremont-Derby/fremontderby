export function sessionLane(session) {
  return { ok: Boolean(session?.lane) && session.lane === session.cookieLane, text: session?.lane === session.cookieLane ? 'Session matches the lane.' : 'Session lane does not match the cookie.' };
}

export function privateReport(report) {
  return { evidence: report?.id || null, text: report?.body ? 'Report id only. Body stays private.' : 'Report needs an id.' };
}

export function fourGateReview(findings) {
  return { due: (findings || []).length >= 4, text: (findings || []).length >= 4 ? 'Review the last four gates.' : 'Not yet four gates.' };
}

export function releaseDiff(diff) {
  return { text: `${diff?.files || 0} files. Risk: ${diff?.risk || 'unknown'}.` };
}

export function latencyBudget(ms) {
  return { ok: ms <= 500, text: ms <= 500 ? 'Inside the league-night budget.' : 'Over the league-night budget.' };
}

export function launchRunbook(step) {
  return { text: step || 'Name the launch step.' };
}

export function statusBanner(banner) {
  return { show: Boolean(banner?.text), text: banner?.text || '' };
}

export function noticeLink(link) {
  return { href: link?.target || '/schedule', text: link?.target ? 'Open the notice target.' : 'Notice falls back to the schedule.' };
}
