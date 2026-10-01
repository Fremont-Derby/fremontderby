export function linkClientError({ clientId, serverCode, stack }) {
  const id = String(clientId || '').trim();
  const code = String(serverCode || '').trim();
  if (!id) return { ok: false, reason: 'The client error needs an id.' };
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) return { ok: false, reason: 'The server code must be a short safe code.' };
  return { ok: true, clientId: id, serverCode: code, stack: null };
}
