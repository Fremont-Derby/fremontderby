export function lineupFixture({ home, away }) {
  if (!home || !away) return 'A live score check needs both lineup fixtures.';
  return 'Both lineup fixtures are ready.';
}
