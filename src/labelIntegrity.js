export function labelIntegrity(labels) {
  const names = labels || [];
  if (names.filter((name) => name.startsWith('agent:')).length > 1) return 'One card keeps one agent label.';
  return 'This card keeps one agent label.';
}
