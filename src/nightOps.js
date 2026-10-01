export function eligibilityReason(player) {
  if (player?.eligible) return { eligible: true, text: 'Eligible.' };
  return { eligible: false, text: player?.reason || 'Missing a requirement.' };
}

export function sessionLane(cookie) {
  const lane = String(cookie || '').split(';').find((part) => part.trim().startsWith('lane='));
  return { lane: lane ? lane.split('=')[1] : null, text: lane ? `Session is for ${lane.split('=')[1]}.` : 'No lane on this session.' };
}

export function leagueNightSteps() {
  return ['Open the season', 'Check the teams', 'Score the match', 'Close the night'];
}

export function manualScore(match, score) {
  if (!match || !score) return null;
  return { match, score, text: `Entered ${score} by hand for later re-entry.` };
}

export function restoreBackup(backup) {
  if (!backup?.lane || backup.lane === 'prod') return { restored: false, text: 'Production backups are not restored here.' };
  return { restored: true, text: `Restored the ${backup.lane} backup.` };
}
