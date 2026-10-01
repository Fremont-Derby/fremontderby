export function missionChrome(mission) {
  return {
    task: mission?.task || 'Finish the task.',
    survey: 'A short survey follows when you finish.',
    abort: 'Stop this mission',
  };
}

export function scheduleRow(match) {
  if (!match?.finished) return { score: null, messages: true };
  return { score: match.score, messages: false };
}

export function scheduleAfterSeason(seasonId) {
  if (!seasonId) return { loaded: false, text: 'Pick a season to load the schedule.' };
  return { loaded: true, text: `Schedule loaded for ${seasonId}.` };
}

export function checkInTable(rows) {
  return (rows || []).map((row) => ({ name: row.name, status: row.status }));
}

export function mockSeason(season) {
  return { id: season?.id || 'mock', teams: (season?.teams || []).slice(0, 4), lineupReady: true };
}
