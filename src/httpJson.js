/** Shared Worker JSON responses (Facade over Response.json + cache headers). */
export function jsonNoStore(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function jsonPublic(body, status = 200, cacheControl = 'public, max-age=30') {
  return Response.json(body, {
    status,
    headers: { 'cache-control': cacheControl },
  });
}
