export function noticeRack({ notice, rack }) {
  if (!notice) return 'Serve the notice before the disputed rack is named.';
  if (!rack) return 'Name one disputed rack.';
  return `Notice served. Disputed rack: ${rack}.`;
}
