export function cueBallLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} scratched the cue ball` : '';
}
