export function captaincy(name) {
  if (!name) return 'Name the new captain before the transfer.';
  return `Captaincy moves to ${name}.`;
}
