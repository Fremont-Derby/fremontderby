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

export function aliasRedirect(request, url) {
  const target = PUBLIC_PATH_ALIASES[url.pathname];
  if (!target) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  return Response.redirect(new URL(target, url.origin), 302);
}
