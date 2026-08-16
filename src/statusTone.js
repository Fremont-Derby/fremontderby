/** Map multi-agent status tone strings to a small canonical set. */

const TONE_STRATEGY = Object.freeze({
  ok: 'ok',
  success: 'ok',
  healthy: 'ok',
  ready: 'ok',
  error: 'error',
  critical: 'error',
  danger: 'error',
  warning: 'warning',
  warn: 'warning',
  muted: 'muted',
  info: 'muted',
  live: 'live',
  tonight: 'tonight',
  done: 'done',
});

export function normalizeStatusTone(tone, fallback = 'muted') {
  if (tone == null || tone === '') return fallback;
  const key = String(tone).trim().toLowerCase();
  return TONE_STRATEGY[key] || fallback;
}
