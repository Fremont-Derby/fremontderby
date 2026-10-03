export function safeServiceMessage(status, text) {
  const body = String(text || '');
  if (status === 401 || status === 403) return '';
  if (status === 429 || body.includes('1015') || body.includes('<html') || body.includes('<!DOCTYPE')) {
    return 'Profile is busy. Wait a moment and try again.';
  }
  if (body.trim().startsWith('{')) return '';
  return body.length > 180 ? 'Profile could not be loaded. Try again.' : '';
}
