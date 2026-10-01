export function raceResult(submission) {
  if (submission?.disputed) return { authoritative: false, text: 'This result is disputed.' };
  return { authoritative: true, text: submission?.text || 'Result recorded.' };
}

export function terminalScore(entry) {
  if (entry?.mismatch) return { blocked: true, recovery: 'Check the rack score and submit again.' };
  if ((entry?.racks || 0) > (entry?.limit || 0)) return { blocked: true, recovery: 'The match is already complete.' };
  return { blocked: false, recovery: null };
}

export function afterWin(match) {
  if (!match?.won) return { action: 'add-rack', text: 'Add the next rack.' };
  return { action: 'match-complete', text: 'Match complete. No more racks.' };
}

export function eraseLastRack(racks) {
  return (racks || []).slice(0, -1);
}

export function liveScore(match) {
  return { home: match?.home ?? 0, away: match?.away ?? 0, text: `${match?.home ?? 0} to ${match?.away ?? 0}` };
}
