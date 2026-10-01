export function rackWin(score, won) {
  const next = { ...score, racks: (score?.racks || 0) + (won ? 1 : 0) };
  return { score: next, text: won ? 'Rack win advances the score.' : 'No rack win.' };
}

export function reopenGate(gate) {
  if (gate?.humanFail) return { open: true, text: 'Human fail reopens the gate.' };
  return { open: false, text: 'Gate stays closed.' };
}

export function auditEvent(event) {
  if (!event?.actor || !event?.action) return null;
  return { text: `${event.actor} ${event.action}.` };
}

export function moderationItem(item) {
  return { queued: item?.status === 'reported', text: item?.status === 'reported' ? 'Message is in the review queue.' : 'Message is clear.' };
}

export function rosterAssignment(team, player) {
  if (!team || !player) return { ok: false, text: 'Assignment needs a team and a player.' };
  return { ok: true, text: `${player} assigned to ${team}.` };
}

export function messageChannels() {
  return ['direct', 'team', 'general'];
}
