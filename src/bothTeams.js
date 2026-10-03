export function bothTeams({ home, away }) {
  if (!home || !away) return 'Score validation needs both teams.';
  return 'Both teams are on the scorecard.';
}
