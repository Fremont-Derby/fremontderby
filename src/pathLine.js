export function inboxPolishLine(inbox = {}) {
  if (!inbox.order) return '';
  return `Inbox: ${inbox.order} message first.`;
}
export function menuDismissLine(menu = {}) {
  if (!menu.dock) return '';
  return 'Menu closes outside the dock. Dock stays lit.';
}
