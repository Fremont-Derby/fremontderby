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
  return `<div class="fd-message-notifications" data-message-notifications hidden>
    <a class="fd-message-indicator" href="/messages" aria-label="Messages" title="Messages" aria-haspopup="true" aria-expanded="false" data-message-indicator${attrs}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H10l-4.7 4.03A.8.8 0 0 1 4 19.42V5.75Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8 8.2h8M8 11.8h5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <span class="fd-message-indicator__badge" data-message-badge hidden></span>
    </a>
    <section class="fd-message-preview" aria-label="Message preview" data-message-preview>
      <div class="fd-message-preview__header">
        <strong>Messages</strong>
        <span data-message-preview-total>Loading…</span>
      </div>
      <div class="fd-message-preview__list" data-message-preview-list>
        <p class="fd-message-preview__empty">Loading message preview…</p>
      </div>
      <a class="fd-message-preview__all" href="/messages">View all messages</a>
    </section>
  </div>`;
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
  .fd-message-notifications { position: relative; flex: 0 0 auto; }
  .fd-message-notifications[hidden] { display: none; }
  .fd-message-indicator { position: relative; width: 42px; height: 42px; display: inline-grid; place-items: center; border: 1px solid #315d45; border-radius: 11px; color: #dbe8e0; background: #0b2418; text-decoration: none; }
  .fd-message-indicator:hover { color: #fff; background: #123522; }
  .fd-message-indicator[aria-current="page"] { color: #07150f; background: #e7f2eb; border-color: #e7f2eb; }
  .fd-message-indicator svg { width: 23px; height: 23px; }
  .fd-message-indicator__badge { position: absolute; top: -6px; right: -7px; min-width: 20px; height: 20px; display: grid; place-items: center; padding: 0 5px; border: 2px solid #06110d; border-radius: 999px; color: #fff; background: #d83d37; font: 900 .68rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-indicator__badge[hidden] { display: none; }
  .fd-message-indicator:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
  .fd-message-preview { position: absolute; top: calc(100% + 9px); right: 0; width: min(360px, calc(100vw - 24px)); padding: 10px; border: 1px solid #315d45; border-radius: 13px; background: #081a12; box-shadow: 0 18px 46px rgba(0,0,0,.42); color: #f4f7f5; opacity: 0; visibility: hidden; transform: translateY(-4px); pointer-events: none; transition: opacity .14s ease, transform .14s ease, visibility .14s; }
  .fd-message-preview::before { content: ''; position: absolute; right: 0; top: -10px; width: 56px; height: 10px; }
  .fd-message-notifications:hover .fd-message-preview,
  .fd-message-notifications[data-open="true"] .fd-message-preview { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
  .fd-message-preview__header { min-height: 34px; padding: 3px 5px 9px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #244936; }
  .fd-message-preview__header strong { font: 900 .92rem/1.2 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-preview__header span { color: #9eb7a8; font: 750 .76rem/1.2 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-preview__list { display: grid; gap: 3px; padding: 5px 0; }
  .fd-message-preview__item { min-width: 0; display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; padding: 10px 8px; border-radius: 9px; color: #f4f7f5; text-decoration: none; }
  .fd-message-preview__item:hover, .fd-message-preview__item:focus-visible { background: #123522; }
  .fd-message-preview__item:focus-visible { outline: 2px solid #9ad6ae; outline-offset: -2px; }
  .fd-message-preview__label { overflow: hidden; color: #e7f2eb; font: 850 .8rem/1.25 Inter, ui-sans-serif, system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
  .fd-message-preview__time { color: #8ca99a; font: 700 .7rem/1.25 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-preview__body { grid-column: 1 / -1; overflow: hidden; color: #b9cabf; font: 500 .78rem/1.35 Inter, ui-sans-serif, system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
  .fd-message-preview__unread { color: #e9bd45; font-weight: 850; }
  .fd-message-preview__empty { margin: 0; padding: 15px 8px; color: #9eb7a8; font: 600 .8rem/1.4 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-preview__all { min-height: 38px; display: flex; align-items: center; justify-content: center; border-top: 1px solid #244936; border-radius: 0 0 8px 8px; color: #b7e2c5; text-decoration: none; font: 850 .78rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-message-preview__all:hover, .fd-message-preview__all:focus-visible { color: #fff; background: #10291d; }
  .fd-nav-menu { display: none; margin-left: auto; position: relative; font: 700 .9rem/1 Inter, ui-sans-serif, system-ui, sans-serif; }
  .fd-nav-menu summary { cursor: pointer; list-style: none; min-height: 42px; display: inline-flex; align-items: center; padding: 9px 12px; border: 1px solid #315d45; border-radius: 10px; background: #0b2418; color: #f4f7f5; }
  .fd-nav-menu summary::-webkit-details-marker { display: none; }
  .fd-nav--mobile { position: absolute; right: 0; top: calc(100% + 8px); width: min(260px, calc(100vw - 24px)); padding: 8px; display: grid; gap: 4px; border: 1px solid #315d45; border-radius: 12px; background: #081a12; box-shadow: 0 14px 38px rgba(0,0,0,.35); }
  .fd-nav--mobile a { width: 100%; }
  @media (max-width: 760px) {
    .fd-shell__inner { min-height: 56px; padding: 7px 12px; }
    .fd-nav--desktop { display: none; }
    .fd-message-notifications { margin-left: auto; }
    .fd-message-preview { position: fixed; top: 64px; right: 12px; left: 12px; width: auto; }
    .fd-nav-menu { display: block; margin-left: 0; }
  }
`;

const shellScript = `<script data-fd-message-indicator-script>
  (() => {
    const notifications = document.querySelector('[data-message-notifications]');
    const indicator = document.querySelector('[data-message-indicator]');
    const badge = document.querySelector('[data-message-badge]');
    const previewList = document.querySelector('[data-message-preview-list]');
    const previewTotal = document.querySelector('[data-message-preview-total]');
    if (!notifications || !indicator || !badge || !previewList || !previewTotal) return;
    let loading = false;
    const token = () => sessionStorage.getItem('fd.accessToken') || '';
    const relativeTime = (value) => {
      const elapsed = Date.now() - Date.parse(value || '');
      if (!Number.isFinite(elapsed) || elapsed < 60000) return 'now';
      const minutes = Math.floor(elapsed / 60000);
      if (minutes < 60) return minutes + 'm';
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + 'h';
      return Math.floor(hours / 24) + 'd';
    };
    const setOpen = (open) => {
      notifications.dataset.open = open ? 'true' : 'false';
      indicator.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) delete notifications.dataset.touchPrimed;
    };
    const renderPreviews = (previews, unread) => {
      previewList.replaceChildren();
      previewTotal.textContent = unread > 0 ? unread + ' unread' : 'Caught up';
      if (!Array.isArray(previews) || previews.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'fd-message-preview__empty';
        empty.textContent = 'No unread messages.';
        previewList.append(empty);
        return;
      }
      previews.forEach((preview) => {
        const item = document.createElement('a');
        item.className = 'fd-message-preview__item';
        item.href = '/messages';
        const label = document.createElement('span');
        label.className = 'fd-message-preview__label';
        label.textContent = String(preview.label || 'Message');
        const time = document.createElement('span');
        time.className = 'fd-message-preview__time';
        time.textContent = relativeTime(preview.lastMessageAt);
        const previewBody = document.createElement('span');
        previewBody.className = 'fd-message-preview__body';
        const count = Math.max(1, Number(preview.unreadCount) || 1);
        const countText = count > 1 ? count + ' unread · ' : '';
        previewBody.textContent = countText + String(preview.body || '');
        if (count > 1) previewBody.classList.add('fd-message-preview__unread');
        item.append(label, time, previewBody);
        previewList.append(item);
      });
    };
    const render = (count, previews = []) => {
      const unread = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
      notifications.hidden = !token();
      badge.hidden = unread === 0;
      badge.textContent = unread > 99 ? '99+' : String(unread);
      const label = unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages';
      indicator.setAttribute('aria-label', label);
      indicator.title = label;
      renderPreviews(previews, unread);
    };
    const refresh = async () => {
      const accessToken = token();
      if (!accessToken) { render(0); return; }
      notifications.hidden = false;
      if (loading || document.hidden) return;
      loading = true;
      try {
        const response = await fetch('/api/me/message-notification-summary', {
          headers: { authorization: 'Bearer ' + accessToken },
        });
        if (response.status === 401) { render(0); return; }
        if (!response.ok) return;
        const body = await response.json();
        render(body.unreadCount, body.previews);
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
    notifications.addEventListener('mouseenter', () => setOpen(true));
    notifications.addEventListener('mouseleave', () => {
      if (!notifications.contains(document.activeElement)) setOpen(false);
    });
    notifications.addEventListener('focusin', () => setOpen(true));
    notifications.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!notifications.contains(document.activeElement)) setOpen(false);
      }, 0);
    });
    indicator.addEventListener('click', (event) => {
      if (!window.matchMedia('(hover: hover)').matches && notifications.dataset.touchPrimed !== 'true') {
        event.preventDefault();
        notifications.dataset.touchPrimed = 'true';
        setOpen(true);
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!notifications.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
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
