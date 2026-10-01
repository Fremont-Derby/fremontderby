export function personaSelector(lane) {
  if (!['jfl', 'gamma'].includes(lane)) return null;
  return { lane, text: `Testing as the ${lane} persona.` };
}

export function leagueAdmin(admin, league) {
  if (!admin || admin.league !== league) return { allowed: false, text: 'This admin can manage only their own league.' };
  return { allowed: true, text: `Managing ${league}.` };
}

export function playerSearchEdit(players, query) {
  return (players || []).filter((player) => player.name.toLowerCase().includes(String(query || '').toLowerCase()));
}

export function seasonSetupSteps() {
  return ['Name the season', 'Add the teams', 'Publish the schedule'];
}

export function prizeSummary(prizes) {
  const total = (prizes || []).reduce((sum, prize) => sum + (prize.amount || 0), 0);
  return { total, text: `Payout total is ${total}.` };
}
