export function saveState(state) {
  if (state === 'pending') return 'Saving the selected side.';
  if (state === 'failed') return 'That did not save. Try again.';
  if (state === 'saved') return 'Saved.';
  return 'Choose a side, then save the rack.';
}
