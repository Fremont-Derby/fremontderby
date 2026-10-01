export function publishedSchedule(season) {
  return { ok: season?.teams === 8 && season?.rounds === 7, text: season?.teams === 8 ? 'Eight teams and seven rounds.' : 'Schedule is not the eight-team season.' };
}

export function blindLineup(lineup) {
  return { ok: (lineup?.players || []).length === 3 && lineup?.blind, text: 'A blind lineup has three players.' };
}

export function dualScore(match) {
  return { ok: Boolean(match?.home && match?.away), text: match?.mismatch ? 'Mismatch needs a recheck.' : 'Both teams can score.' };
}

export function standingsAfterFinal(rows) {
  return { ok: (rows || []).every((row) => row.final), text: 'Standings count only finalized play.' };
}

export function auditedCorrection(change) {
  return { ok: Boolean(change?.actor && change?.reason && change?.before && change?.after), text: 'A correction needs actor, reason, before, and after.' };
}
