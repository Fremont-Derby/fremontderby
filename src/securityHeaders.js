/**
 * Baseline security headers + CSP nonce helpers.
 * Inline scripts require the per-request nonce (CSP3 ignores 'unsafe-inline' when a nonce is present).
 */

export function createRequestNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += String.fromCharCode(b);
  // base64url-ish, CSP-token safe
  return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function applyScriptNonces(html, nonce) {
  if (!nonce || typeof html !== 'string') return html;
  return html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
}

export function htmlSecurityHeaders(nonce) {
  const csp = [
    "default-src 'self'",
    `script-src 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://accounts.google.com https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://*.supabase.co",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  return {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'content-security-policy': csp,
  };
}

export function apiSecurityHeaders(extra = {}) {
  return {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY',
    'cross-origin-resource-policy': 'same-origin',
    ...extra,
  };
}

/** Refuse test-lane auth bypass outside jfl/dru. */
export function assertBetaBypassLane(env = {}) {
  const bypass = String(env.BETA_AUTH_BYPASS || '').trim();
  if (bypass !== '1') return;
  const environment = String(env.ENVIRONMENT || '').trim();
  if (environment === 'jfl' || environment === 'dru') return;
  throw new Error(
    `BETA_AUTH_BYPASS is set but ENVIRONMENT="${environment || '(empty)'}" is not a test lane (jfl|dru)`,
  );
}
