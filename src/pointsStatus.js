export function pointsStatusLabel(team) {
  return team && team.points != null ? team.points + ' points' : 'Points are missing';
}
