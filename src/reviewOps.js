export function auditHistory(events) {
  return (events || []).filter((event) => event.actor && event.action).map((event) => `${event.actor} ${event.action}`);
}

export function moderationQueue(messages) {
  return (messages || []).filter((message) => message.flagged).map((message) => ({ id: message.id, reason: message.reason || 'flagged' }));
}

export function assignRoster(team, player) {
  if (!team?.name || !player?.name) return null;
  if ((team.players || []).includes(player.name)) return { added: false, text: `${player.name} is already on ${team.name}.` };
  return { added: true, text: `${player.name} assigned to ${team.name}.` };
}

export function rulesGuide(rules) {
  return (rules || []).slice(0, 5).map((rule) => rule.title).filter(Boolean);
}

export function coherenceCheck(pages) {
  const missing = (pages || []).filter((page) => !page.heading);
  return { ok: missing.length === 0, text: missing.length ? `${missing[0].name} has no heading.` : 'Pages have headings.' };
}
