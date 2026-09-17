import { isRetiredTradePath } from './retiredTradesGate.js';

export const PUBLIC_PATH_ALIASES = {
  '/home': '/',
  '/register': '/profile',
  '/tonight': '/availability',
  '/check-in': '/availability',
  '/checkin': '/availability',
  '/check_in': '/availability',
  '/ready': '/availability',
  '/login': '/profile',
  '/signin': '/profile',
  '/sign-in': '/profile',
  '/signup': '/profile',
  '/sign-up': '/profile',
  '/join': '/profile',
  '/score': '/scorecard',
  '/scores': '/scorecard',
  '/roster': '/teams',
  '/trade': '/teams',
  '/help': '/rules',
  '/faq': '/rules',
};

function canonicalPath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }
  return PUBLIC_PATH_ALIASES[pathname] || null;
}

export function aliasRedirect(request, url) {
  if (isRetiredTradePath(url.pathname)) {
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    return new Response('<!doctype html><title>Not found</title><p>There is no Fremont Derby page at that address.</p>', {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  const target = canonicalPath(url.pathname);
  if (!target || target === url.pathname) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  const next = new URL(url.origin + target);
  next.search = url.search;
  return Response.redirect(next, 302);
}
