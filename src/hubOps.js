export function adminHub(links) {
  return (links || []).filter((link) => link.href).map((link) => ({ label: link.label, href: link.href }));
}

export function rackLedger(racks) {
  return (racks || []).map((rack, index) => ({ rack: index + 1, score: rack.score }));
}

export function destructiveAction(action) {
  if (!action?.name || !action?.consequence) return null;
  return { text: `${action.name} will ${action.consequence}.` };
}

export function statusBanner(message) {
  if (!message) return { visible: false };
  return { visible: true, text: message };
}

export function messageScroll(events) {
  return { scrolls: true, text: events?.length ? 'The message list scrolls with the wheel.' : 'No messages yet.' };
}
