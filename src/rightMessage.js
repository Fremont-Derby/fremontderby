export function rightMessage({ thread, body }) {
  const name = String(thread || '').trim();
  const text = String(body || '').trim();
  if (!name) return { ok: false, reason: 'Choose the thread.' };
  if (text.length < 8) return { ok: false, reason: 'Write the message.' };
  return { ok: true, thread: name, body: text };
}
