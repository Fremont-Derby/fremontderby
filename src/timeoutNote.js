export function timeoutNote({ killed }) {
  if (killed) return 'The timeout manager restarted. Check whether a player saw a failed save before treating it as a user bug.';
  return 'No timeout-manager restart in this check.';
}
