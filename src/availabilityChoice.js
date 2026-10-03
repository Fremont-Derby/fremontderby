export function availabilityChoiceLabel(choice = {}) {
  const date = choice.date || 'Date TBD';
  const round = choice.round || 'Round TBD';
  const role = choice.role || 'player';
  const status = choice.status || 'not checked in';
  return `${date} · ${round} · ${role} · ${status}`;
}
