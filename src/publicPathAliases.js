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
  '/trade': '/trades',
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
  const target = canonicalPath(url.pathname);
  if (!target || target === url.pathname) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  const next = new URL(url.origin + target);
  next.search = url.search;
  return Response.redirect(next, 302);
}
