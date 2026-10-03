export function statusWord(state) {
  if (state === 'mismatch') return 'Mismatch. The word is the status, not the color.';
  if (state === 'saved') return 'Saved. The word is the status, not the color.';
  return 'Ready. The word is the status, not the color.';
}
