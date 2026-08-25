export const MODERN_PRIMARY_DESTINATIONS = Object.freeze([
  Object.freeze({ href: '/', label: 'Home', key: 'home', ball: 'H' }),
  Object.freeze({ href: '/teams', label: 'Teams', key: 'teams', ball: 'T' }),
  Object.freeze({ href: '/schedule', label: 'Schedule', key: 'schedule', ball: '9' }),
  Object.freeze({ href: '/messages', label: 'Messages', key: 'messages', ball: 'M' }),
  Object.freeze({ href: '/profile', label: 'Profile', key: 'profile', ball: 'P' }),
]);

export const MODERN_SECONDARY_DESTINATIONS = Object.freeze([
  Object.freeze({ href: '/scorecard', label: 'Score', key: 'score' }),
  Object.freeze({ href: '/availability', label: 'Check in', key: 'availability' }),
  Object.freeze({ href: '/lineup', label: 'Lineup', key: 'lineup' }),
  Object.freeze({ href: '/standings', label: 'Standings', key: 'standings' }),
  Object.freeze({ href: '/prizes', label: 'Prizes', key: 'prizes' }),
  Object.freeze({ href: '/rules', label: 'Rules', key: 'rules' }),
  Object.freeze({ href: '/demo', label: 'Test drive', key: 'demo' }),
  Object.freeze({ href: '/season-setup', label: 'Season setup', key: 'season-setup' }),
  Object.freeze({ href: '/admin', label: 'Admin', key: 'admin' }),
  Object.freeze({ href: '/admin/players', label: 'Players', key: 'admin-players' }),
  Object.freeze({ href: '/admin/seasons', label: 'Seasons', key: 'admin-seasons' }),
  Object.freeze({ href: '/admin/operations', label: 'Operations', key: 'admin-operations' }),
  Object.freeze({ href: '/messages/moderation', label: 'Moderation', key: 'moderation' }),
]);

function routeKey(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/availability') return 'availability';
  if (pathname === '/lineup') return 'lineup';
  if (pathname === '/season-setup') return 'season-setup';
  if (pathname === '/rules') return 'rules';
  if (pathname === '/prizes') return 'prizes';
  if (pathname === '/demo' || pathname.startsWith('/sandbox/')) return 'demo';
  if (pathname === '/messages/moderation') return 'moderation';
  if (pathname === '/admin/players') return 'admin-players';
  if (pathname === '/admin/seasons') return 'admin-seasons';
  if (pathname === '/admin/operations') return 'admin-operations';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname.startsWith('/teams')) return 'teams';
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/standings')) return 'standings';
  if (pathname.startsWith('/scorecard')) return 'score';
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/profile')) return 'profile';
  return null;
}

function link(item, activeKey, className = '') {
  const current = activeKey === item.key;
  const attrs = current ? ' aria-current="page" data-active="true"' : '';
  const classAttr = className ? ` class="${className}"` : '';
  return `<a href="${item.href}" data-nav-key="${item.key}"${classAttr}${attrs}>${item.label}</a>`;
}

function renderDesktopPrimary(pathname) {
  const activeKey = routeKey(pathname);
  return `<nav class="fd-nav fd-nav--desktop fd-nav--modern-primary" aria-label="Primary navigation" data-fd-modern-primary>
    ${MODERN_PRIMARY_DESTINATIONS.map((item) => link(item, activeKey)).join('\n    ')}
  </nav>`;
}

function renderMoreMenu(pathname) {
  const activeKey = routeKey(pathname);
  const secondaryActive = MODERN_SECONDARY_DESTINATIONS.some((item) => item.key === activeKey);
  const active = secondaryActive ? ' data-active="true"' : '';
  return `<details class="fd-nav-menu fd-more-menu" data-fd-more-menu${active}>
    <summary aria-label="Menu navigation">Menu</summary>
    <nav class="fd-nav fd-nav--mobile fd-nav--secondary" aria-label="Menu navigation">
      ${MODERN_SECONDARY_DESTINATIONS.map((item) => link(item, activeKey)).join('\n      ')}
    </nav>
  </details>`;
}

function renderMobileDock(pathname) {
  const activeKey = routeKey(pathname);
  const links = MODERN_PRIMARY_DESTINATIONS.map((item) => {
    const current = activeKey === item.key;
    const attrs = current ? ' aria-current="page" data-active="true"' : '';
    return `<a href="${item.href}" data-nav-key="${item.key}"${attrs}>
      <span class="fd-mobile-dock__ball" aria-hidden="true">${item.ball}</span>
      <span>${item.label}</span>
    </a>`;
  }).join('');
  return `<nav class="fd-mobile-dock fd-mobile-dock--modern" aria-label="Primary navigation" data-fd-mobile-dock>${links}</nav>`;
}

function escapeAttribute(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderEnvironmentBadge(env = {}) {
  const fullSha = String(env.DEPLOY_GIT_SHA || '').trim();
  const shortSha = fullSha ? fullSha.slice(0, 7) : 'local';
  const title = fullSha ? `JFL deploy ${fullSha}` : 'JFL environment';
  return `<span class="fd-env-badge" data-fd-jfl-environment title="${escapeAttribute(title)}"><strong>JFL</strong><span>${escapeAttribute(shortSha)}</span></span>`;
}

function injectEnvironmentBadge(html, env) {
  if (html.includes('data-fd-jfl-environment')) return html;
  return html.replace(
    /(<a class="fd-brand"[\s\S]*?<\/a>)/i,
    `$1\n      ${renderEnvironmentBadge(env)}`,
  );
}

function replaceNavigation(html, pathname) {
  let next = html.replace(
    /<nav class="fd-nav fd-nav--desktop" aria-label="Primary navigation">[\s\S]*?<\/nav>/i,
    renderDesktopPrimary(pathname),
  );
  next = next.replace(
    /<details class="fd-nav-menu">[\s\S]*?<\/details>/i,
    renderMoreMenu(pathname),
  );
  const dock = renderMobileDock(pathname);
  if (/<nav class="fd-mobile-dock"[\s\S]*?<\/nav>/i.test(next)) {
    next = next.replace(/<nav class="fd-mobile-dock"[\s\S]*?<\/nav>/i, dock);
  } else if (/<\/header>/i.test(next)) {
    next = next.replace(/<\/header>/i, `</header>\n  ${dock}`);
  }
  return next;
}

export const jflModernShellStyles = `
  .fd-shell[data-fd-modern-shell="true"] {
    border-bottom: 1px solid var(--fd-border) !important;
    border-top: 3px solid var(--fd-accent) !important;
  }
  .fd-shell[data-fd-modern-shell="true"] .fd-shell__inner {
    min-height: 66px !important;
    gap: 12px !important;
  }
  .fd-env-badge {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 1px solid rgba(255,255,255,.38);
    border-radius: 999px;
    background: rgba(0,0,0,.18);
    color: #fff;
    font: 800 .68rem/1 Inter, ui-sans-serif, system-ui, sans-serif;
    letter-spacing: .02em;
    white-space: nowrap;
  }
  .fd-env-badge strong { color: #fff !important; letter-spacing: .09em; }
  .fd-env-badge span { color: #d9eadf; font-variant-numeric: tabular-nums; }
  .fd-nav--modern-primary { margin-left: auto !important; }
  .fd-nav--modern-primary a,
  .fd-more-menu summary,
  .fd-nav--secondary a {
    min-height: 44px !important;
  }
  .fd-more-menu { display: block !important; margin-left: 0 !important; }
  .fd-shell[data-fd-modern-shell="true"] [data-fd-more-menu] > summary {
    min-width: 64px;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border: 1px solid #7fa991 !important;
    background: #073c28 !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    font-weight: 900 !important;
  }
  .fd-shell[data-fd-modern-shell="true"] [data-fd-more-menu] > summary:hover,
  .fd-shell[data-fd-modern-shell="true"] [data-fd-more-menu] > summary:focus-visible {
    background: #0a5136 !important;
    color: #fff !important;
  }
  .fd-more-menu[open] summary {
    border-color: #b7dac4 !important;
    background: #0f6845 !important;
    color: #fff !important;
  }
  .fd-more-menu[data-active="true"] summary {
    border-color: #d8ad3f !important;
    background: #073c28 !important;
    color: #fff !important;
    font-weight: 900 !important;
  }
  .fd-nav--secondary {
    max-height: min(70vh, 560px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .fd-nav--secondary a[aria-current="page"] {
    border-color: #b6d4c1 !important;
    background: var(--fd-green-100) !important;
    color: var(--fd-green-950) !important;
  }
  .fd-mobile-dock--modern {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  }
  .fd-mobile-dock--modern a { min-height: 58px !important; }
  .fd-mobile-dock--modern a[data-nav-key="home"] { --fd-dock-accent: #ffffff; }
  .fd-mobile-dock--modern a[data-nav-key="teams"] { --fd-dock-accent: #69c8ff; }
  .fd-mobile-dock--modern a[data-nav-key="schedule"] { --fd-dock-accent: #ffd166; }
  .fd-mobile-dock--modern a[data-nav-key="messages"] { --fd-dock-accent: #d8a6ff; }
  .fd-mobile-dock--modern a[data-nav-key="profile"] { --fd-dock-accent: #ffad8f; }
  .fd-shell[data-fd-modern-shell="true"] a:focus-visible,
  .fd-shell[data-fd-modern-shell="true"] summary:focus-visible,
  .fd-mobile-dock--modern a:focus-visible {
    outline: 3px solid var(--fd-focus) !important;
    outline-offset: 2px !important;
  }
  @media (max-width: 760px) {
    body[data-fd-modern-shell-body="true"] {
      padding-bottom: calc(84px + env(safe-area-inset-bottom)) !important;
    }
    .fd-shell[data-fd-modern-shell="true"] .fd-shell__inner {
      padding-inline: 10px !important;
      gap: 8px !important;
    }
    .fd-shell[data-fd-modern-shell="true"] .fd-brand > span:last-child { display: none; }
    .fd-env-badge { margin-right: auto; }
    .fd-nav--modern-primary { display: none !important; }
    .fd-message-notifications { margin-left: 0 !important; }
    .fd-more-menu { margin-left: 0 !important; }
    .fd-more-menu summary { min-width: 52px; padding-inline: 9px !important; }
  }
  @media (max-width: 380px) {
    .fd-env-badge span { display: none; }
  }
  @media (forced-colors: active) {
    .fd-env-badge,
    .fd-more-menu summary,
    .fd-nav--secondary a,
    .fd-mobile-dock--modern a {
      border: 1px solid ButtonText !important;
      forced-color-adjust: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fd-shell[data-fd-modern-shell="true"] *,
    .fd-mobile-dock--modern * { transition: none !important; }
  }
`;

function responseWithBody(response, body, headers) {
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function decorateJflModernShell(response, request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const url = request instanceof Request ? new URL(request.url) : new URL(String(request));
  const headers = new Headers(response.headers);
  if (url.searchParams.get('shell') === 'legacy') {
    headers.set('x-fremont-ui-shell', 'legacy');
    return responseWithBody(response, await response.text(), headers);
  }

  let html = await response.text();
  if (!html.includes('data-fd-shell')) return responseWithBody(response, html, headers);

  html = html.replace(
    '<header class="fd-shell" data-fd-shell>',
    '<header class="fd-shell" data-fd-shell data-fd-modern-shell="true">',
  );
  html = html.replace(/<body([^>]*)>/i, '<body$1 data-fd-modern-shell-body="true">');
  html = injectEnvironmentBadge(html, env);
  html = replaceNavigation(html, url.pathname);
  if (!html.includes('data-fd-modern-shell-styles')) {
    html = html.replace(
      /<\/head>/i,
      `<style data-fd-modern-shell-styles>${jflModernShellStyles}</style>\n</head>`,
    );
  }

  headers.set('x-fremont-ui-shell', 'modern-v1');
  headers.set('cache-control', 'no-store');
  return responseWithBody(response, html, headers);
}
