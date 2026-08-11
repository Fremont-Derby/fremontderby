const NAV_ITEMS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/teams', label: 'Teams', key: 'teams' },
  { href: '/standings', label: 'Standings', key: 'standings' },
  { href: '/rules', label: 'Rules', key: 'rules' },
  { href: '/demo', label: 'Demo', key: 'demo' },
  { href: '/scorecard', label: 'Score', key: 'score' },
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
]);

function sectionForPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/rules') return 'rules';
  if (pathname === '/demo' || pathname.startsWith('/sandbox/')) return 'demo';
  if (pathname.startsWith('/teams') || pathname === '/trades') return 'teams';
  if (pathname.startsWith('/standings') || pathname === '/prizes') return 'standings';
  if (pathname.startsWith('/scorecard')) return 'score';
  if (pathname.startsWith('/profile')) return 'profile';
  return null;
}

function navLinks(pathname, compact = false) {
  const active = sectionForPath(pathname);
  return NAV_ITEMS.map((item) => {
    const current = active === item.key;
    const attrs = current ? ' aria-current="page" data-active="true"' : '';
    return `<a href="${item.href}"${attrs}>${item.label}</a>`;
  }).join(compact ? '' : '\n');
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
  .fd-nav-menu { display: none; margin-left: auto; position: relative; font: 700 .9rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-nav-menu summary { cursor: pointer; list-style: none; min-height: 42px; display: inline-flex; align-items: center; padding: 9px 12px; border: 1px solid #315d45; border-radius: 10px; background: #0b2418; color: #f4f7f5; }
  .fd-nav-menu summary::-webkit-details-marker { display: none; }
  .fd-nav--mobile { position: absolute; right: 0; top: calc(100% + 8px); width: min(260px, calc(100vw - 24px)); padding: 8px; display: grid; gap: 4px; border: 1px solid #315d45; border-radius: 12px; background: #081a12; box-shadow: 0 14px 38px rgba(0,0,0,.35); }
  .fd-nav--mobile a { width: 100%; }
  @media (max-width: 760px) {
    .fd-shell__inner { min-height: 56px; padding: 7px 12px; }
    .fd-nav--desktop { display: none; }
    .fd-nav-menu { display: block; }
  }
`;

export function decorateHtmlWithShell(html, pathname = '/') {
  if (typeof html !== 'string' || html.includes('data-fd-shell')) return html;
  if (!/<body(?:\s|>)/i.test(html)) return html;

  const withStyles = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-shell-styles>${shellStyles}</style>\n</head>`)
    : html;

  return withStyles.replace(/<body([^>]*)>/i, `<body$1>\n${renderPrimaryNavigation(pathname)}`);
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
