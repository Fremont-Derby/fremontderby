/**
 * Conditional JSON responses for live-refresh GETs.
 *
 * Strategy (see issue #744):
 * - Phase 1: strong ETag = SHA-256 of canonical JSON body (saves mobile bandwidth/parse).
 * - Phase 2: weak ETag from domain version tokens (saves Worker + Supabase work).
 *
 * Auth-scoped `/api/me/*` must keep Cache-Control: private, no-store.
 * Public season GETs may use private, no-store + ETag (browser revalidate) without
 * putting shared CDN cache on personalized data.
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

export function etagMatches(ifNoneMatch, etag) {
  if (!ifNoneMatch || !etag) return false;
  const candidates = String(ifNoneMatch)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (candidates.includes('*')) return true;
  const normalized = etag.trim();
  return candidates.some((part) => {
    const token = part.replace(/^W\//, '').trim();
    return token === normalized || part === normalized;
  });
}

/**
 * @param {Request} request
 * @param {unknown} body
 * @param {{ status?: number, cacheControl?: string, headers?: Record<string, string> }} [options]
 */
export async function conditionalJsonResponse(request, body, options = {}) {
  const etag = await strongEtagFromBody(body);
  const headers = {
    'cache-control': options.cacheControl || 'private, no-store',
    etag,
    vary: 'Authorization, Accept-Encoding',
    ...(options.headers || {}),
  };

  if (request && etagMatches(request.headers?.get?.('if-none-match'), etag)) {
    return new Response(null, { status: 304, headers });
  }

  return Response.json(body, {
    status: options.status ?? 200,
    headers,
  });
}

/** Client helper contract for live refresh fetchers. */
export function shouldSkipBodyRender(response) {
  return response && response.status === 304;
}
