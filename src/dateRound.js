export function roundsForDate(rounds, date) {
  const wanted = String(date || '').slice(0, 10);
  if (!wanted) return rounds || [];
  return (rounds || []).filter((round) => String(round.scheduledOn || round.scheduled_on || '').slice(0, 10) === wanted);
}
