export function addedPlayerLine(change = {}) {
  if (!change.player || !change.team) return '';
  return `${change.player} was added to ${change.team}.`;
}
export function captainTransferLine(change = {}) {
  if (!change.from || !change.to || !change.team) return '';
  return `Captain of ${change.team} moved from ${change.from} to ${change.to}.`;
}
