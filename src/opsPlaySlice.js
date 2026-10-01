export function surveySummary(rows) {
  const recent = (rows || []).slice(0, 5);
  return { count: recent.length, latest: recent[0]?.note || null };
}

export function replaceTestDrive(entry) {
  if (entry === 'test-drive') return { href: '/missions', label: 'Play a mission' };
  return { href: entry || '/missions', label: 'Continue' };
}

export function completeRuns(runs) {
  return (runs || []).filter((run) => run.lane && run.finished);
}

export function scorecardDrive(match) {
  if (!match?.opponent) return null;
  return { step: 'score', text: `Score the match against ${match.opponent}.` };
}

export function markAvailability(player, night, status) {
  if (!player || !night || !['yes', 'no', 'maybe'].includes(status)) return null;
  return { player, night, status };
}
