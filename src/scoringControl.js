export function selectedScoringControl(name) {
  const label = String(name || '').trim();
  return label ? `Selected: ${label}` : '';
}
