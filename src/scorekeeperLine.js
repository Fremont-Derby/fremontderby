export function scorekeeperLine(name) {
  const value = String(name || '').trim();
  return value ? `Scorekeeper: ${value}` : 'Scorekeeper not set';
}
