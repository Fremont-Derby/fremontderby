import { apiSecurityHeaders, createRequestNonce, htmlSecurityHeaders } from './securityHeaders.js';

const GATE_ZERO = '0';
const HEALTH_PATHS = new Set(['/health', '/health/environment']);

function headSafeResponse(body, init, method) {
  return new Response(method === 'HEAD' ? null : body, init);
}

function baselineHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fremont Derby · Validation</title>
</head>
<body>
  <main>
    <h1>Fremont Derby validation</h1>
    <p>Gate 0 is active on this test lane.</p>
    <p>Only deployment health checks are enabled. Other Fremont Derby features are intentionally unavailable during this validation step.</p>
  </main>
</body>
</html>`;
}

function unavailableHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not available · Fremont Derby</title>
</head>
<body>
  <main>
    <h1>Not available yet</h1>
    <p>This Fremont Derby feature is intentionally unavailable during the current validation step.</p>
  </main>
</body>
</html>`;
}

export function progressiveReleaseGateResponse(request, env = {}) {
  if (String(env.PROGRESSIVE_RELEASE_GATE || '').trim() !== GATE_ZERO) return null;

  const url = new URL(request.url);
  if (HEALTH_PATHS.has(url.pathname)) return null;

  if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
    const nonce = createRequestNonce();
    return headSafeResponse(baselineHtml(), {
      status: 200,
      headers: htmlSecurityHeaders(nonce),
    }, request.method);
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/internal/')) {
    return headSafeResponse(
      JSON.stringify({ error: 'This feature is not available during the current validation step.' }),
      {
        status: 404,
        headers: apiSecurityHeaders({ 'content-type': 'application/json; charset=utf-8' }),
      },
      request.method,
    );
  }

  const nonce = createRequestNonce();
  return headSafeResponse(unavailableHtml(), {
    status: 404,
    headers: htmlSecurityHeaders(nonce),
  }, request.method);
}
