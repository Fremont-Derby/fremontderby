export function selectedSide(side) {
  if (side !== 'A' && side !== 'B') return 'Choose a side, then save the rack.';
  return `Selected side ${side}.`;
}
