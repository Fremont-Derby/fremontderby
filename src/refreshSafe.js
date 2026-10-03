export function refreshSafe({ saved, pending, secondTab }) {
  if (pending) return { tone: 'pending', text: 'A save is still in progress. Wait for Saved before you refresh.' };
  if (secondTab && saved) return { tone: 'saved', text: 'Saved on this device. The other tab should refresh to see it.' };
  if (saved) return { tone: 'saved', text: 'Saved. Refresh keeps this result.' };
  return { tone: 'ready', text: 'Nothing is waiting. Refresh is safe.' };
}

export function testerFeedback({ lane, sha }) {
  const where = lane || 'this lane';
  const rev = sha ? ` at ${sha.slice(0, 7)}` : '';
  return { text: `Report a problem on ${where}${rev}.` };
}
