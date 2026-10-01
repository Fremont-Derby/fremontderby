const PAGES = new Map([
  ['/playoffs', ['Playoffs', 'Postseason bracket from the published schedule. Semifinals and the championship show here once playoffs start.']],
  ['/playoff', ['Playoffs', 'Postseason bracket from the published schedule. Semifinals and the championship show here once playoffs start.']],
  ['/bracket', ['Playoffs', 'Postseason bracket from the published schedule. Semifinals and the championship show here once playoffs start.']],
  ['/brackets', ['Playoffs', 'Postseason bracket from the published schedule. Semifinals and the championship show here once playoffs start.']],
  ['/trades', ['Trades', 'Roster trades use the signed-in Profile session. No token paste.']],
  ['/trade', ['Trades', 'Roster trades use the signed-in Profile session. No token paste.']],
  ['/players', ['Player directory', 'Public names and team context only. Contact numbers, payments, and internal IDs are never shown.']],
  ['/player', ['Player directory', 'Public names and team context only. Contact numbers, payments, and internal IDs are never shown.']],
  ['/directory', ['Player directory', 'Public names and team context only. Contact numbers, payments, and internal IDs are never shown.']],
  ['/notifications', ['Notifications', 'League alerts. Open Messages for the conversation itself.']],
  ['/notify', ['Notifications', 'League alerts. Open Messages for the conversation itself.']],
  ['/free-agents', ['Free agents', 'Players looking for a roster. Captains can open Teams to invite someone.']],
  ['/fa', ['Free agents', 'Players looking for a roster. Captains can open Teams to invite someone.']],
  ['/subs', ['Free agents', 'Players looking for a roster. Captains can open Teams to invite someone.']],
  ['/substitutes', ['Free agents', 'Players looking for a roster. Captains can open Teams to invite someone.']],
  ['/practice', ['Practice', 'Published league nights are the default table window. Teams may practice or play a makeup before the posted date.']],
  ['/practices', ['Practice', 'Published league nights are the default table window. Teams may practice or play a makeup before the posted date.']],
]);

const REWRITES = new Map([
  ['/check-in', '/availability'],
  ['/checkin', '/availability'],
  ['/inbox', '/messages'],
  ['/scoring', '/scorecard'],
  ['/roster', '/teams'],
]);

function pageHtml(title, copy) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>${title} · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-jfl-public-surface="true">
    <header><h1>${title}</h1></header>
    <p>${copy}</p>
    <p><a href="/schedule">Schedule</a> · <a href="/teams">Teams</a> · <a href="/standings">Standings</a> · <a href="/profile">Sign in</a></p>
  </main>
</body>
</html>`;
}

function stripTrailingSlash(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function routeJflPublicSurfaces(request) {
  if (!request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  const pathname = stripTrailingSlash(url.pathname);
  const page = PAGES.get(pathname);
  if (page) {
    return new Response(pageHtml(page[0], page[1]), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  const rewritten = REWRITES.get(pathname);
  if (!rewritten) return null;
  const next = new URL(request.url);
  next.pathname = rewritten;
  return { rewrite: new Request(next, request) };
}
