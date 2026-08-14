/**
 * Conditional JSON responses for live-refresh GETs.
 *
 * Phase 1: strong ETag = SHA-256 of canonical JSON body.
 * Phase 2: weak ETag from domain version tokens (304 before building body).
 *
 * Auth-scoped `/api/me/*` keeps Cache-Control: private, no-store.
 */

function canonicalJson(value) {
  return JSON.stringify(value);
}

export async function strongEtagFromBody(body) {
  const encoded = new TextEncoder().encode(canonicalJson(body));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `"${hex}"`;
}

/** Hex fingerprint for version tokens (no quotes). */
export async function versionTokenFromValue(value) {
  const etag = await strongEtagFromBody(value);
  return etag.slice(1, -1);
}

export function weakEtag(scope, version) {
  const safeScope = String(scope || 'resource').replace(/[^a-zA-Z0-9._:-]/g, '_');
  const safeVersion = String(version || '0').replace(/["\\]/g, '');
  return `W/"${safeScope}:${safeVersion}"`;
}

export function etagMatches(ifNoneMatch, etag) {
  if (!ifNoneMatch || !etag) return false;
  const candidates = String(ifNoneMatch)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (candidates.includes('*')) return true;
  const normalized = etag.trim();
  const normalizedStrong = normalized.replace(/^W\//, '');
  return candidates.some((part) => {
    const token = part.trim();
    const strong = token.replace(/^W\//, '');
    return token === normalized || strong === normalizedStrong || token === normalizedStrong || strong === normalized;
  });
}

function baseHeaders(etag, options = {}) {
  return {
    'cache-control': options.cacheControl || 'private, no-store',
    etag,
    vary: options.vary || 'Authorization, Accept-Encoding',
    ...(options.headers || {}),
  };
}

export function notModifiedResponse(etag, options = {}) {
  return new Response(null, {
    status: 304,
    headers: baseHeaders(etag, options),
  });
}

/**
 * Strong body-hash ETag (Phase 1). Always builds body first.
 */
export async function conditionalJsonResponse(request, body, options = {}) {
  const etag = options.etag || (await strongEtagFromBody(body));
  const headers = baseHeaders(etag, options);

  if (request && etagMatches(request.headers?.get?.('if-none-match'), etag)) {
    return new Response(null, { status: 304, headers });
  }

  return Response.json(body, {
    status: options.status ?? 200,
    headers,
  });
}

/**
 * Weak version ETag (Phase 2).
 * If If-None-Match matches the version token, returns 304 without calling buildBody.
 *
 * @param {Request} request
 * @param {{ scope: string, version: string, buildBody: () => Promise<unknown> | unknown, cacheControl?: string, headers?: Record<string,string> }} params
 */
export async function conditionalJsonFromVersion(request, params) {
  const etag = weakEtag(params.scope, params.version);
  const options = {
    cacheControl: params.cacheControl,
    headers: params.headers,
    vary: params.vary,
  };

  if (request && etagMatches(request.headers?.get?.('if-none-match'), etag)) {
    return notModifiedResponse(etag, options);
  }

  const body = await params.buildBody();
  return Response.json(body, {
    status: params.status ?? 200,
    headers: baseHeaders(etag, options),
  });
}

export function shouldSkipBodyRender(response) {
  return response && response.status === 304;
}
