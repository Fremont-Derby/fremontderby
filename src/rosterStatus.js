export function rosterStatusLabel(team) {
  const count = Number(team && team.playerCount || 0);
  return count > 0 ? count + ' players' : 'Roster is empty';
}
