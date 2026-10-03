export function finishedScheduleCard(match = {}) {
  const done = ['finalized', 'corrected'].includes(match.status);
  const score = match.teamScore || match.score || '';
  const matchups = Array.isArray(match.playerMatchups) ? match.playerMatchups : [];
  return {
    done,
    scoreLine: done && score ? `Team score ${score}` : '',
    matchupLines: done ? matchups.map((row) => `${row.playerAName} ${row.racksA} – ${row.playerBName} ${row.racksB}`) : [],
    actions: done ? ['Lineup'] : ['Score', 'Lineup'],
  };
}
