const EXPECTED_HOSTS = Object.freeze({
  'fremontderby.com': 'production',
  'www.fremontderby.com': 'production',
  'jfl.fremontderby.com': 'jfl',
  'dru.fremontderby.com': 'dru',
  'gamma.fremontderby.com': 'gamma',
});

const NON_PRODUCTION = new Set(['jfl', 'dru', 'gamma', 'staging']);

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function environmentFingerprint(request, env = {}) {
  const host = new URL(request.url).hostname.toLowerCase();
  const runtime = String(env.ENVIRONMENT || 'production').trim().toLowerCase();
  const expected = EXPECTED_HOSTS[host] || null;
  const mismatch = Boolean(expected && expected !== runtime)
    || (NON_PRODUCTION.has(runtime) && !expected && !['localhost', '127.0.0.1'].includes(host));
  const version = String(env.CF_VERSION_METADATA?.tag || env.DEPLOY_GIT_SHA || env.CF_VERSION_METADATA?.id || '').trim();
  return { runtime, expected, mismatch, version };
}

export async function injectEnvironmentFingerprint(response, request, env = {}) {
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;
  const { runtime, expected, mismatch, version } = environmentFingerprint(request, env);
  if (!mismatch && !NON_PRODUCTION.has(runtime)) return response;

  const html = await response.text();
  if (!mismatch && html.includes('data-fd-environment-fingerprint')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const shortVersion = /^[0-9a-f]{40}$/i.test(version) ? version.slice(0, 8) : version || 'unknown';
  const label = mismatch
    ? `ENVIRONMENT MISMATCH · ${expected ? `Expected ${expected.toUpperCase()}` : 'Unexpected host'} · Runtime ${runtime.toUpperCase()}`
    : `${runtime.toUpperCase()} · ${shortVersion}`;
  const marker = `<aside class="fd-environment-fingerprint${mismatch ? ' fd-environment-fingerprint--mismatch' : ''}" data-fd-environment-fingerprint="${escapeHtml(runtime)}" data-fd-environment-mismatch="${mismatch}" role="${mismatch ? 'alert' : 'note'}" title="${escapeHtml(version || 'Deployed version unavailable')}">${escapeHtml(label)}</aside>`;
  const styles = `<style data-fd-environment-fingerprint-styles>
    .fd-environment-fingerprint{position:fixed;right:8px;bottom:calc(80px + env(safe-area-inset-bottom));z-index:2147483000;max-width:calc(100vw - 16px);padding:5px 9px;border:2px solid #124c36;border-radius:8px;background:#f5fff6;color:#073523;font:800 12px/1.25 system-ui,sans-serif;box-shadow:0 2px 8px #0004;overflow-wrap:anywhere}
    .fd-environment-fingerprint--mismatch{left:8px;right:8px;bottom:auto;top:8px;border-color:#a81818;background:#fff2ee;color:#790d0d;text-align:center}
    @media (min-width:761px){.fd-environment-fingerprint:not(.fd-environment-fingerprint--mismatch){bottom:8px}}
  </style>`;
  const withStyles = html.replace(/<\/head>/i, `${styles}</head>`);
  const withMarker = withStyles.replace(/<\/body>/i, `${marker}</body>`);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(withMarker, { status: response.status, statusText: response.statusText, headers });
}
