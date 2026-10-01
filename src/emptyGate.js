export function emptyState(page) {
  return { ok: Boolean(page?.empty && page?.action), text: page?.action || 'Add one next action.' };
}
export function discoverable(link) {
  return { ok: Boolean(link?.label && link?.path), text: link?.path ? `${link.label} is at ${link.path}.` : 'Show the path.' };
}
export function colorIndependent(state) {
  return { ok: Boolean(state?.word), text: state?.word || 'Name the status in words.' };
}
export function manualScore(outage) {
  return { ok: Boolean(outage?.step), text: outage?.step || 'Enter the score by hand.' };
}
export function incidentTree(outage) {
  return { ok: Boolean(outage?.name && outage?.first), text: outage?.first || 'Name the first response.' };
}
export function topError(error) {
  return { ok: Boolean(error?.workflow && error?.count), text: error?.workflow ? `${error.workflow}: ${error.count}.` : 'Name the workflow.' };
}
export function knownIssue(issue) {
  return { shown: Boolean(issue?.title && issue?.blocking === false), text: issue?.title || 'Name the known issue.' };
}
export function eligibilityWhy(player) {
  if (player?.paid && player?.available) return { ok: true, text: 'Paid and available.' };
  return { ok: false, text: player?.paid ? 'Not available.' : 'Payment is missing.' };
}
