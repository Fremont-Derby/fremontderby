const LINKS = [
  '<a href="/players" data-nav-key="players">Players</a>',
  '<a href="/free-agents" data-nav-key="free-agents">Free agents</a>',
  '<a href="/practice" data-nav-key="practice">Practice</a>',
  '<a href="/playoffs" data-nav-key="playoffs">Playoffs</a>',
  '<a href="/trades" data-nav-key="trades">Trades</a>',
  '<a href="/notifications" data-nav-key="notifications">Notifications</a>',
].join('\n      ');

export function injectJflRegistrationNav(html) {
  const source = String(html || '');
  if (!source.includes('data-nav-key="standings"')) return source;
  if (source.includes('data-nav-key="practice"')) return source;
  return source.replace(
    '<a href="/standings" data-nav-key="standings"',
    `${LINKS}\n      <a href="/standings" data-nav-key="standings"`,
  );
}

export async function applyJflRegistrationNav(response) {
  if (!response || !(response.headers.get('content-type') || '').includes('text/html')) {
    return response;
  }
  const html = injectJflRegistrationNav(await response.text());
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
