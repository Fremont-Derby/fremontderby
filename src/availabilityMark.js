export function availabilityMark(choice = {}) {
  if (!choice.date || !choice.status) return '';
  return `Checked in as ${choice.status} for ${choice.date}.`;
}
