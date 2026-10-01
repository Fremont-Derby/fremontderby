export function lineupSentence(status) {
  return { ok: Boolean(status?.sentence), text: status?.sentence || 'Say the lineup state in one sentence.' };
}
export function namedTeams(match) {
  return { ok: Boolean(match?.homeName && match?.awayName), text: match?.homeName ? `${match.homeName} against ${match.awayName}.` : 'Name both teams.' };
}
export function checkinRate(calls) {
  return { ok: (calls || 0) <= 3, text: (calls || 0) > 3 ? 'Check-in is sending too many requests.' : 'Check-in rate is safe.' };
}
export function lintBlocker(error) {
  return { named: Boolean(error?.file && error?.rule), text: error?.rule ? `${error.file} fails ${error.rule}.` : 'Name the file and the rule.' };
}
export function deployedSha(badge) {
  return { ok: Boolean(badge?.host && badge?.sha), text: badge?.sha ? `${badge.host} is ${badge.sha}.` : 'Show the host and the SHA.' };
}
export function fixtureWithoutSql(fixture) {
  return { ok: Boolean(fixture?.name && fixture?.sql !== true), text: fixture?.sql ? 'Fixture uses SQL.' : 'Fixture is product data.' };
}
export function twoCaptainTrial(trial) {
  return { ok: Boolean(trial?.home && trial?.away), text: 'Name both captains.' };
}
export function gammaLint(lane) {
  return { ok: lane !== 'gamma', text: 'Gamma lint stays on the Gamma lane.' };
}
