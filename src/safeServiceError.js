export function safeServiceMessage(status, text) {
  const raw = String(text || '');
  const html = /<!doctype|<html/i.test(raw);
  if (status === 401 || status === 403) return 'Sign in again to continue.';
  if (status === 429 || html || raw.includes('1015')) return 'Profile is busy. Wait a moment and try again.';
  return 'Profile could not be loaded. Try again.';
}
