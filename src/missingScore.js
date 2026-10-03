export function missingScore({ date, link }) {
  if (!date) return 'This score date is not on the list.';
  if (!link) return 'This score link is not on the list.';
  return 'This score is on the list.';
}
