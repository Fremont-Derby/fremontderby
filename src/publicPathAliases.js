export const PUBLIC_PATH_ALIASES = {
  '/home': '/',
  '/register': '/profile',
  '/tonight': '/availability',
  '/check-in': '/availability',
  '/checkin': '/availability',
  '/ready': '/availability',
};

export function aliasRedirect(request, url) {
  const target = PUBLIC_PATH_ALIASES[url.pathname];
  if (!target) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  return Response.redirect(new URL(target, url.origin), 302);
}
