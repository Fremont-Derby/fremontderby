export const DRU_PUBLIC_SURFACE = {
  host: 'dru.fremontderby.com',
  healthPath: '/health',
  html200: [
    '/',
    '/availability',
    '/free-agents',
    '/lineup',
    '/messages',
    '/notifications',
    '/players',
    '/playoffs',
    '/practice',
    '/prizes',
    '/profile',
    '/rules',
    '/schedule',
    '/scorecard',
    '/standings',
    '/teams',
  ],
  retired404: ['/trades'],
};

export function expectedPublicStatus(path) {
  const normalized = path === '' ? '/' : (path.startsWith('/') ? path : `/${path}`);
  if (normalized === DRU_PUBLIC_SURFACE.healthPath) return 200;
  if (DRU_PUBLIC_SURFACE.html200.includes(normalized)) return 200;
  if (DRU_PUBLIC_SURFACE.retired404.includes(normalized)) return 404;
  return null;
}

export function formatCanaryFailure({ host, kind, status, url, error }) {
  return [
    `Canary failed host=${host || 'unknown'}`,
    `kind=${kind || 'unknown'}`,
    `status=${status == null ? 'n/a' : status}`,
    `url=${url || 'n/a'}`,
    `error=${error || 'n/a'}`,
  ].join(' ');
}
