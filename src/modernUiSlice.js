export const MODERN_UI_PROOF_PATH = '/rules';

export function getModernUiMode(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl') return 'legacy';
  if (!request || request.method !== 'GET') return 'legacy';

  const url = new URL(request.url);
  if (url.pathname !== MODERN_UI_PROOF_PATH) return 'legacy';
  if (url.searchParams.get('ui') === 'legacy') return 'legacy';

  return 'modern';
}

function workerVersion(env = {}) {
  return env?.CF_VERSION_METADATA?.id || 'unknown';
}

export async function decorateModernUiSliceResponse(response, request, env = {}) {
  if (getModernUiMode(request, env) !== 'modern') return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const headers = new Headers(response.headers);
  headers.set('x-fremont-environment', 'jfl');
  headers.set('x-fremont-ui-mode', 'modern');
  headers.set('x-fremont-worker-version', workerVersion(env));
  headers.set('cache-control', 'no-store');

  const banner = '<aside data-fd-modern-ui-slice="true" role="status" style="position:sticky;top:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#0b1510;color:#f4fff8;border-bottom:2px solid #43bd7d;font:800 14px/1.2 system-ui,sans-serif"><span>JFL · Modern UI preview</span><a href="/rules?ui=legacy" style="color:#07110b;background:#43bd7d;padding:8px 12px;border-radius:999px;text-decoration:none;white-space:nowrap">View legacy</a></aside>';

  let html = await response.text();
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-fd-ui-mode="modern">${banner}`);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
