export function dualScorecard(home, away) {
  if (!home?.team || !away?.team) return { valid: false, text: 'Both teams are required.' };
  return { valid: true, text: `${home.team} and ${away.team} can both score this match.` };
}

export function editLineup(lineup) {
  return { submitted: false, order: lineup?.order || [], text: 'Editing unsubmits this lineup.' };
}

export function privacyLabel(event) {
  if (!event?.kind || event.playerName) return null;
  return { kind: event.kind, text: `${event.kind} is recorded without a player name.` };
}

export function lineupLock(captains) {
  const both = (captains || []).filter((captain) => captain.submitted).length === 2;
  return { editable: !both, text: both ? 'Both captains submitted. Lineup is locked.' : 'Lineup stays editable until both captains submit.' };
}

export function playerSearch(players, query) {
  const needle = String(query || '').toLowerCase();
  return (players || []).filter((player) => player.name.toLowerCase().includes(needle));
}
