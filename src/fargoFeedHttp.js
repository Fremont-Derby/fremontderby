import { toFargoFeed } from './fargoFeed.js';

export function handleFargoFeedRequest(request, { matches = [] } = {}) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } });
  }
  return Response.json(toFargoFeed(matches), {
    headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}
