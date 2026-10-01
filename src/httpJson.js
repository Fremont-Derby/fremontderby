import { apiSecurityHeaders } from './securityHeaders.js';

/** Shared Worker JSON responses (Response.json + cache headers). */
export function jsonNoStore(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: apiSecurityHeaders(extraHeaders),
  });
}

export function jsonPublic(body, status = 200, cacheControl = 'public, max-age=30') {
  return Response.json(body, {
    status,
    headers: apiSecurityHeaders({ 'cache-control': cacheControl }),
  });
}
