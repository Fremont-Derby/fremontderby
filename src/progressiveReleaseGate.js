const GATE_ZERO = '0';
const HEALTH_PATHS = new Set(['/health', '/health/environment']);

function baseHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  };
}

function responseForMethod(request, body, init) {
  return new Response(request.method === 'HEAD' ? null : body, init);
}

export function progressiveReleaseGateResponse(request, env = {}) {
  if (String(env.PROGRESSIVE_RELEASE_GATE || '').trim() !== GATE_ZERO) return null;

  const url = new URL(request.url);
  if (HEALTH_PATHS.has(url.pathname)) return null;

  if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
    return responseForMethod(request, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fremont Derby · Validation</title></head><body><main><h1>Fremont Derby validation</h1><p>Gate 0 is active on this test lane.</p><p>Only deployment health checks are enabled. Other Fremont Derby features are intentionally unavailable during this validation step.</p></main></body></html>`, {
      status: 200,
      headers: baseHeaders('text/html; charset=utf-8'),
    });
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/internal/')) {
    return responseForMethod(request, JSON.stringify({ error: 'This feature is not available during the current validation step.' }), {
      status: 404,
      headers: baseHeaders('application/json; charset=utf-8'),
    });
  }

  return responseForMethod(request, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not available · Fremont Derby</title></head><body><main><h1>Not available yet</h1><p>This Fremont Derby feature is intentionally unavailable during the current validation step.</p></main></body></html>`, {
    status: 404,
    headers: baseHeaders('text/html; charset=utf-8'),
  });
}
