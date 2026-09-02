const LINKS = [
  '<a href="/players" data-nav-key="players">Players</a>',
  '<a href="/free-agents" data-nav-key="free-agents">Free agents</a>',
  '<a href="/practice" data-nav-key="practice">Practice</a>',
  '<a href="/playoffs" data-nav-key="playoffs">Playoffs</a>',
  '<a href="/trades" data-nav-key="trades">Trades</a>',
  '<a href="/notifications" data-nav-key="notifications">Notifications</a>',
].join('\n      ');

const HOME_SHORTCUTS = `<nav class="fd-home__facts" data-fd-registration-links aria-label="Registration week">
        <a class="fd-home__fact" href="/teams">Teams</a>
        <a class="fd-home__fact" href="/free-agents">Free agents</a>
        <a class="fd-home__fact" href="/practice">Practice</a>
        <a class="fd-home__fact" href="/availability">Check in</a>
      </nav>`;

export function injectJflRegistrationNav(html) {
  const source = String(html || '');
  if (!source.includes('data-nav-key="standings"')) return source;
  if (source.includes('data-nav-key="practice"')) return source;
  return source.replace(
    '<a href="/standings" data-nav-key="standings"',
    `${LINKS}\n      <a href="/standings" data-nav-key="standings"`,
  );
}

export function injectJflRegistrationHome(html) {
  const source = String(html || '');
  if (!source.includes('data-fd-modern-home')) return source;
  if (source.includes('data-fd-registration-links')) return source;
  if (!source.includes('</header>')) return source;
  return source.replace('</header>', `${HOME_SHORTCUTS}\n    </header>`);
}

export async function applyJflRegistrationNav(response) {
  if (!response || !(response.headers.get('content-type') || '').includes('text/html')) {
    return response;
  }
  let html = await response.text();
  html = injectJflRegistrationNav(html);
  html = injectJflRegistrationHome(html);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
