const NAV_ITEMS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/teams', label: 'Teams', key: 'teams' },
  { href: '/standings', label: 'Standings', key: 'standings' },
  { href: '/rules', label: 'Rules', key: 'rules' },
  { href: '/demo', label: 'Demo', key: 'demo' },
  { href: '/scorecard', label: 'Score', key: 'score' },
  { href: '/messages', label: 'Messages', key: 'messages' },
  { href: '/profile', label: 'Profile', key: 'profile' },
];

const APP_PAGE_PATHS = new Set([
  '/scorecard',
  '/standings',
  '/prizes',
  '/season-setup',
  '/lineup',
  '/profile',
  '/availability',
  '/teams',
  '/trades',
  '/messages',
  '/messages/moderation',
]);

function sectionForPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/rules') return 'rules';
  if (pathname === '/demo' || pathname.startsWith('/sandbox/')) return 'demo';
  if (pathname.startsWith('/teams') || pathname === '/trades') return 'teams';
  if (pathname.startsWith('/standings') || pathname === '/prizes') return 'standings';
  if (pathname.startsWith('/scorecard')) return 'score';
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/profile')) return 'profile';
  return null;
}

function navLinks(pathname, compact = false) {
  const active = sectionForPath(pathname);
  return NAV_ITEMS.filter((item) => compact || item.key !== 'messages').map((item) => {
    const current = active === item.key;
    const attrs = current ? ' aria-current="page" data-active="true"' : '';
    return `<a href="${item.href}"${attrs}>${item.label}</a>`;
  }).join(compact ? '' : '\n');
}

function renderMessageIndicator(pathname) {
  const current = sectionForPath(pathname) === 'messages';
  const attrs = current ? ' aria-current="page" data-active="true"' : '';
  return `<a class="fd-message-indicator" href="/messages" aria-label="Messages" title="Messages" data-message-indicator hidden${attrs}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H10l-4.7 4.03A.8.8 0 0 1 4 19.42V5.75Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M8 8.2h8M8 11.8h5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    <span class="fd-message-indicator__badge" data-message-badge hidden></span>
  </a>`;
}

export function renderPrimaryNavigation(pathname = '/') {
  return `<header class="fd-shell" data-fd-shell>
    <div class="fd-shell__inner">
      <a class="fd-brand" href="/" aria-label="Fremont Derby home">
        <span class="fd-brand__ball" aria-hidden="true">8</span>
        <span>Fremont Derby</span>
      </a>
      <nav class="fd-nav fd-nav--desktop" aria-label="Primary navigation">
        ${navLinks(pathname)}
      </nav>
      ${renderMessageIndicator(pathname)}
      <details class="fd-nav-menu">
        <summary>Menu</summary>
        <nav class="fd-nav fd-nav--mobile" aria-label="Primary navigation">
          ${navLinks(pathname, true)}
        </nav>
      </details>
    </div>
  </header>`;
}

export const shellStyles = `
  .fd-shell { position: sticky; top: 0; z-index: 1000; width: 100%; background: rgba(6,17,13,.96); border-bottom: 1px solid #315d45; backdrop-filter: blur(12px); color: #f4f7f5; }
  .fd-shell, .fd-shell * { box-sizing: border-box; }
  .fd-shell__inner { width: min(1120px, 100%); min-height: 58px; margin: 0 auto; padding: 8px 16px; display: flex; align-items: center; gap: 18px; }
  .fd-brand { display: inline-flex; align-items: center; gap: 9px; color: #f4f7f5; text-decoration: none; font: 800 .98rem/1 Inter, ui-sans-serif, system-ui, sans-serif; white-space: nowrap; }
  .fd-brand__ball { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: #f4f7f5; color: #07150f; border: 3px solid #d9dedb; font-size: .8rem; }
  .fd-nav { margin-left: auto; display: flex; align-items: center; gap: 4px; }
  .fd-nav a { min-height: 40px; display: inline-flex; align-items: center; padding: 9px 10px; border-radius: 9px; color: #c9d7cf; text-decoration: none; font: 700 .86rem/1 Inter, ui-sans-serif, system-ui, sans-serif; border: 1px solid transparent; }
  .fd-nav a:hover { color: #fff; background: #10291d; }
  .fd-nav a[aria-current="page"] { color: #07150f; background: #e7f2eb; border-color: #e7f2eb; }
  .fd-nav a:focus-visible, .fd-brand:focus-visible, .fd-nav-menu summary:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
  .fd-message-indicator { position: relative; flex: 0 0 auto; width: 42px; height: 42px; display: inline-grid; place-items: center; border: 1px solid #315d45; border-radius: 11px; color: #dbe8e0; background: #0b2418; text-decoration: none; }
  .fd-message-indicator[hidden] { display: none; }
  .fd-message-indicator:hover { color: #fff; background: #123522; }
  .fd-message-indicator[aria-current="page"] { color: #07150f; background: #e7f2eb; border-color: #e7f2eb; }
  .fd-message-indicator svg { width: 23px; height: 23px; }
  .fd-message-indicator__badge { position: absolute; top: -6px; right: -7px; min-width: 20px; height: 20px; display: grid; place-items: center; padding: 0 5px; border: 2px solid #06110d; border-radius: 999px; color: #fff; background: #d83d37; font: 900 .68rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-indicator__badge[hidden] { display: none; }
  .fd-message-indicator:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
  .fd-nav-menu { display: none; margin-left: auto; position: relative; font: 700 .9rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-nav-menu summary { cursor: pointer; list-style: none; min-height: 42px; display: inline-flex; align-items: center; padding: 9px 12px; border: 1px solid #315d45; border-radius: 10px; background: #0b2418; color: #f4f7f5; }
  .fd-nav-menu summary::-webkit-details-marker { display: none; }
  .fd-nav--mobile { position: absolute; right: 0; top: calc(100% + 8px); width: min(260px, calc(100vw - 24px)); padding: 8px; display: grid; gap: 4px; border: 1px solid #315d45; border-radius: 12px; background: #081a12; box-shadow: 0 14px 38px rgba(0,0,0,.35); }
  .fd-nav--mobile a { width: 100%; }
  @media (max-width: 760px) {
    .fd-shell__inner { min-height: 56px; padding: 7px 12px; }
    .fd-nav--desktop { display: none; }
    .fd-message-indicator { margin-left: auto; }
    .fd-nav-menu { display: block; margin-left: 0; }
  }
`;

const shellScript = `<script data-fd-message-indicator-script>
  (() => {
    const indicator = document.querySelector('[data-message-indicator]');
    const badge = document.querySelector('[data-message-badge]');
    if (!indicator || !badge) return;
    let loading = false;
    const token = () => sessionStorage.getItem('fd.accessToken') || '';
    const render = (count) => {
      const unread = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
      indicator.hidden = !token();
      badge.hidden = unread === 0;
      badge.textContent = unread > 99 ? '99+' : String(unread);
      const label = unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages';
      indicator.setAttribute('aria-label', label);
      indicator.title = label;
    };
    const refresh = async () => {
      const accessToken = token();
      if (!accessToken) { render(0); return; }
      indicator.hidden = false;
      if (loading || document.hidden) return;
      loading = true;
      try {
        const response = await fetch('/api/me/message-notification-summary', {
          headers: { authorization: 'Bearer ' + accessToken },
        });
        if (response.status === 401) { render(0); return; }
        if (!response.ok) return;
        const body = await response.json();
        render(body.unreadCount);
      } catch {
        // Keep the icon usable when a background refresh temporarily fails.
      } finally {
        loading = false;
      }
    };
    render(0);
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('fd:messages-read', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.setInterval(refresh, 15000);
  })();
</script>`;

export function decorateHtmlWithShell(html, pathname = '/') {
  if (typeof html !== 'string' || html.includes('data-fd-shell')) return html;
  if (!/<body(?:\s|>)/i.test(html)) return html;

  const withStyles = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-shell-styles>${shellStyles}</style>\n</head>`)
    : html;

  const withShell = withStyles.replace(
    /<body([^>]*)>/i,
    `<body$1>\n${renderPrimaryNavigation(pathname)}`,
  );
  return /<\/body>/i.test(withShell)
    ? withShell.replace(/<\/body>/i, `${shellScript}\n</body>`)
    : `${withShell}${shellScript}`;
}

export function isKnownAppPagePath(pathname) {
  return APP_PAGE_PATHS.has(pathname);
}

export function renderNotFoundPage(pathname = '') {
  const escapedPath = String(pathname)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#07150f" />
  <title>404 · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 50% 10%, #153d2a 0, #081a12 34%, #06110d 72%); color: #f4f7f5; }
    .lost { width: min(820px, calc(100% - 28px)); margin: 0 auto; padding: clamp(28px, 7vw, 72px) 0 64px; text-align: center; }
    .hound { width: min(420px, 84vw); margin: 0 auto 22px; filter: drop-shadow(0 18px 24px rgba(0,0,0,.28)); }
    .hound svg { width: 100%; height: auto; display: block; }
    .kicker { color: #e9bd45; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; font-size: .78rem; }
    h1 { margin: 8px 0 12px; font-size: clamp(2.2rem, 9vw, 5.4rem); line-height: .92; letter-spacing: -.045em; }
    p { color: #bfd0c6; line-height: 1.6; }
    .path { display: inline-block; max-width: 100%; overflow-wrap: anywhere; color: #e7f2eb; background: #0b2418; border: 1px solid #315d45; border-radius: 9px; padding: 7px 10px; }
    .actions { margin-top: 24px; display: flex; justify-content: center; flex-wrap: wrap; gap: 9px; }
    .actions a { min-height: 46px; display: inline-flex; align-items: center; padding: 11px 16px; border-radius: 11px; border: 1px solid #315d45; color: #f4f7f5; text-decoration: none; background: #0b2418; font-weight: 800; }
    .actions a.primary { background: #e7f2eb; border-color: #e7f2eb; color: #07150f; }
    .actions a:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
  </style>
</head>
<body>
  <main class="lost">
    <div class="hound" role="img" aria-label="A confused basset hound with long ears leaning over a pool table and staring at a missing ball">
      <svg viewBox="0 0 640 390" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect x="72" y="270" width="496" height="72" rx="20" fill="#173f2a" stroke="#315d45" stroke-width="10"/>
        <path d="M155 281 112 365M485 281l43 84" stroke="#4a3627" stroke-width="18" stroke-linecap="round"/>
        <ellipse cx="322" cy="196" rx="136" ry="105" fill="#d3a46f"/>
        <path d="M220 148c-58-69-111-54-104 12 5 45 43 96 91 111 20-33 27-79 13-123Z" fill="#8f5c39"/>
        <path d="M424 148c58-69 111-54 104 12-5 45-43 96-91 111-20-33-27-79-13-123Z" fill="#8f5c39"/>
        <path d="M250 112c18-38 53-58 72-58s54 20 72 58c-42-20-102-20-144 0Z" fill="#f0ddd0"/>
        <ellipse cx="322" cy="220" rx="78" ry="58" fill="#f0ddd0"/>
        <ellipse cx="322" cy="235" rx="42" ry="28" fill="#4b3325"/>
        <circle cx="273" cy="178" r="10" fill="#17120f"/><circle cx="371" cy="178" r="10" fill="#17120f"/>
        <path d="M264 197c14 10 31 10 44 0M336 197c14 10 31 10 44 0" fill="none" stroke="#7b4f34" stroke-width="7" stroke-linecap="round"/>
        <path d="M295 261c18 9 36 9 54 0" fill="none" stroke="#7b4f34" stroke-width="7" stroke-linecap="round"/>
        <circle cx="214" cy="304" r="21" fill="#fff" stroke="#d7ddd9" stroke-width="5"/>
        <circle cx="214" cy="304" r="10" fill="#111"/><text x="214" y="308" text-anchor="middle" font-size="13" font-family="system-ui" font-weight="900" fill="#fff">8</text>
        <path d="M453 299c33 5 61 1 92-13" fill="none" stroke="#d8ad3f" stroke-width="8" stroke-linecap="round"/>
        <path d="M446 300l-46 23" fill="none" stroke="#d8ad3f" stroke-width="8" stroke-linecap="round"/>
        <circle cx="385" cy="330" r="8" fill="#f4f7f5" opacity=".32"/>
      </svg>
    </div>
    <div class="kicker">404 · scratched on the break</div>
    <h1>This dog lost the rack.</h1>
    <p>We sniffed around, but there is no Fremont Derby page at <span class="path">${escapedPath || '/'}</span>.</p>
    <div class="actions">
      <a class="primary" href="/">Back home</a>
      <a href="/teams">Teams</a>
      <a href="/standings">Standings</a>
      <a href="/demo">Demo season</a>
    </div>
  </main>
</body>
</html>`;
}
