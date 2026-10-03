export function messageThreadLabel(thread) {
  return thread && thread.matchupId ? 'Matchup thread' : 'No matchup thread';
}
