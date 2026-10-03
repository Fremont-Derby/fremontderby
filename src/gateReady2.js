export function standingsAfterFinal(matches) {
  return { ok: (matches || []).every((match) => match.final), text: 'Standings count only finalized matches.' };
}
export function adminCorrection(change) {
  return { ok: Boolean(change?.actor && change?.reason && change?.before && change?.after), text: 'A correction needs actor, reason, before, and after.' };
}
export function messageRoom(room) {
  return { ok: ['direct', 'team', 'league'].includes(room), text: 'Message is direct, team, or league.' };
}
export function prizeConfig(prize) {
  return { ok: Boolean(prize?.name && prize?.amount != null), text: prize?.name ? `${prize.name} pays ${prize.amount}.` : 'Name the prize.' };
}
export function postseasonLineup(lineup) {
  return { ok: (lineup?.players || []).length === 4 && Boolean(lineup?.anchor), text: 'Postseason lineup is four players with an anchor.' };
}
export function opsRecovery(exception) {
  return { ok: Boolean(exception?.name && exception?.step), text: exception?.step || 'Name the recovery step.' };
}
export function cleanRoom(trial) {
  return { ok: Boolean(trial?.homeCaptain && trial?.awayCaptain && trial?.clean), text: 'Trial needs two captains and a clean room.' };
}
export function releaseRecommendation(trial) {
  return { go: trial?.passed === true, text: trial?.passed ? 'Recommend release.' : 'Do not recommend release.' };
}
