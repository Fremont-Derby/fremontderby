import { decorateHtmlWithShell } from './appShell.js';
import { renderAdminGatewayPage } from './adminGatewayPage.js';

export function routeAdminGateway(request) {
  const url = new URL(request.url);
  if (url.pathname !== '/admin') return null;
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  return new Response(decorateHtmlWithShell(renderAdminGatewayPage(), '/admin'), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
