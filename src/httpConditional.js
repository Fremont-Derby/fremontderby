/**
 * Conditional JSON responses for live-refresh GETs.
 *
 * WHY (cost + snappy UX):
 * - Warm polls with If-None-Match should 304 before building large JSON (cheap backend).
 * - Cold loads should NOT pay for a version query AND a full build — one trip only.
 * - Public season data can use short shared TTL; /api/me/* stays private, no-store.
 */

function canonicalJson(value) {
  return JSON.stringify(value);
}

/**
 * WHY: weak version tokens are not crypto secrets. FNV-1a is enough to detect
 * league-scale fingerprint changes without SHA-256 on every warm poll.
 */
export function fastVersionToken(value) {
  const s = canonicalJson(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // mix length to reduce collision classes for empty vs non-empty
  h ^= s.length;
  h = Math.imul(h, 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export async function strongEtagFromBody(body) {
  const encoded = new TextEncoder().encode(canonicalJson(body));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `"${hex}"`;
}

export async function versionTokenFromValue(value) {
  // Prefer fast token for version scopes; strong body etags still use SHA-256.
  return fastVersionToken(value);
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
 * Weak version ETag with cold/warm split.
 *
 * @param {Request} request
 * @param {{
 *   scope: string,
 *   cacheControl?: string,
 *   headers?: Record<string,string>,
 *   // Warm path only (If-None-Match present): cheap fingerprint.
 *   getVersion?: () => Promise<string>,
 *   // Always used when body must be produced.
 *   buildBody: () => Promise<unknown> | unknown,
 *   // Optional: derive version from body on cold path so we skip getVersion.
 *   versionFromBody?: (body: unknown) => Promise<string> | string,
 * }} params
 */
export async function conditionalJsonFromVersion(request, params) {
  const ifNoneMatch = request?.headers?.get?.('if-none-match') || '';
  const options = {
    cacheControl: params.cacheControl,
    headers: params.headers,
    vary: params.vary,
  };

  // Warm path: cheap version check first — skip full build on 304.
  if (ifNoneMatch && typeof params.getVersion === 'function') {
    const version = await params.getVersion();
    const etag = weakEtag(params.scope, version);
    if (etagMatches(ifNoneMatch, etag)) {
      return notModifiedResponse(etag, options);
    }
    const body = await params.buildBody();
    return Response.json(body, {
      status: params.status ?? 200,
      headers: baseHeaders(etag, options),
    });
  }

  // Cold path: one full build only (no version query). ETag from body or versionFromBody.
  const body = await params.buildBody();
  let version;
  if (typeof params.versionFromBody === 'function') {
    version = await params.versionFromBody(body);
  } else if (typeof params.getVersion === 'function') {
    version = await params.getVersion();
  } else {
    version = await versionTokenFromValue(body);
  }
  const etag = weakEtag(params.scope, version);
  return Response.json(body, {
    status: params.status ?? 200,
    headers: baseHeaders(etag, options),
  });
}

export function shouldSkipBodyRender(response) {
  return response && response.status === 304;
}
