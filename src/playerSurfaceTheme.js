const PLAYER_SURFACES = new Map([
  ['/', 'home'],
  ['/schedule', 'schedule'],
  ['/scorecard', 'score-picker'],
  ['/profile', 'profile'],
  ['/teams', 'teams'],
  ['/lineup', 'lineup'],
  ['/availability', 'availability'],
  ['/standings', 'standings'],
  ['/prizes', 'standings'],
  ['/messages', 'messages'],
  ['/trades', 'teams'],
]);

export const playerSurfaceThemeStyles = `
  body[data-fd-player-surface] {
    color-scheme: light !important;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] *,
  body[data-fd-player-surface] *::before,
  body[data-fd-player-surface] *::after {
    min-width: 0;
  }

  /* Neutralize dark page skins that still ship local CSS variables. */
  body[data-fd-player-surface] {
    --panel: var(--fd-bg-surface) !important;
    --line: var(--fd-border) !important;
    --muted: var(--fd-text-muted) !important;
    --green: var(--fd-success) !important;
    --gold: var(--fd-accent) !important;
    --red: var(--fd-danger) !important;
    --bg: var(--fd-bg-page) !important;
    --text: var(--fd-text) !important;
  }

  body[data-fd-player-surface] .app,
  body[data-fd-player-surface] main {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] .topbar,
  body[data-fd-player-surface] .head,
  body[data-fd-player-surface] .hub-heading,
  body[data-fd-player-surface] .page-head {
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] h1,
  body[data-fd-player-surface] h2,
  body[data-fd-player-surface] h3,
  body[data-fd-player-surface] strong {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] .muted,
  body[data-fd-player-surface] .meta,
  body[data-fd-player-surface] .action-meta,
  body[data-fd-player-surface] .hub-kicker,
  body[data-fd-player-surface] .kicker,
  body[data-fd-player-surface] .round-meta,
  body[data-fd-player-surface] label {
    color: var(--fd-text-muted) !important;
  }

  /* Sticky, readable status (works with live regions already in pages). */
  body[data-fd-player-surface] .status {
    display: inline-flex !important;
    align-items: center !important;
    min-height: 34px !important;
    max-width: min(100%, 420px) !important;
    margin-left: auto !important;
    padding: 6px 12px !important;
    border: 1px solid var(--fd-border) !important;
    border-radius: var(--fd-radius-control) !important;
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text-muted) !important;
    font-size: .84rem !important;
    font-weight: 750 !important;
    line-height: 1.25 !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface] .status[data-tone="error"] {
    background: var(--fd-danger-bg) !important;
    border-color: #f0b4ad !important;
    color: var(--fd-danger-text) !important;
  }

  body[data-fd-player-surface] .status[data-tone="ok"],
  body[data-fd-player-surface] .status[data-tone="ready"] {
    background: var(--fd-success-bg) !important;
    border-color: #b7dfc5 !important;
    color: var(--fd-success) !important;
  }

  body[data-fd-player-surface] .panel,
  body[data-fd-player-surface] .round,
  body[data-fd-player-surface] .card,
  body[data-fd-player-surface] .match,
  body[data-fd-player-surface] .filters,
  body[data-fd-player-surface] .toolbar,
  body[data-fd-player-surface] .controls,
  body[data-fd-player-surface] .action-card,
  body[data-fd-player-surface] .page-state,
  body[data-fd-player-surface] .night-hub,
  body[data-fd-player-surface] .empty {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface] .match {
    border-top-color: var(--fd-accent) !important;
  }

  body[data-fd-player-surface] .match[data-status="in_progress"] {
    border-top-color: var(--fd-success) !important;
    box-shadow: 0 0 0 1px rgba(8, 115, 61, .18), var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface] .status-pill {
    background: var(--fd-bg-subtle) !important;
    color: var(--fd-text) !important;
    border: 1px solid var(--fd-border) !important;
  }

  body[data-fd-player-surface] .status-pill[data-tone="live"] {
    background: var(--fd-success-bg) !important;
    color: var(--fd-success) !important;
    border-color: #b7dfc5 !important;
  }

  body[data-fd-player-surface] .status-pill[data-tone="tonight"] {
    background: var(--fd-accent-bg) !important;
    color: var(--fd-accent-text) !important;
    border-color: #ecd889 !important;
  }

  body[data-fd-player-surface] .status-pill[data-tone="done"] {
    background: var(--fd-bg-subtle) !important;
    color: var(--fd-text-muted) !important;
  }

  body[data-fd-player-surface] select,
  body[data-fd-player-surface] input,
  body[data-fd-player-surface] textarea {
    min-height: max(var(--fd-control-min), var(--fd-touch-min)) !important;
    border-radius: var(--fd-radius-control) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
    font-size: 16px !important;
  }
  body[data-fd-player-surface] select {
    appearance: none !important;
    -webkit-appearance: none !important;
  }
  body[data-fd-player-surface] .status {
    border-radius: var(--fd-radius-control) !important;
  }
  body[data-fd-player-surface] .status-pill {
    border-radius: var(--fd-radius-pill) !important;
  }

  body[data-fd-player-surface] a.primary,
  body[data-fd-player-surface] .match-actions a.primary,
  body[data-fd-player-surface] button.primary,
  body[data-fd-player-surface] .state-action:not(.state-action--secondary) {
    background: linear-gradient(180deg, var(--fd-primary-hover), var(--fd-primary-strong)) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }

  body[data-fd-player-surface] .match-actions a,
  body[data-fd-player-surface] .action-card {
    text-decoration: none !important;
  }

  body[data-fd-player-surface] .action-card:hover {
    background: var(--fd-bg-subtle) !important;
  }

  body[data-fd-player-surface] .action-card--primary {
    background: linear-gradient(145deg, var(--fd-success-bg), var(--fd-bg-surface) 55%) !important;
  }

  body[data-fd-player-surface] .hub-team {
    background: var(--fd-bg-subtle) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] .page-state {
    border-top-color: var(--fd-success) !important;
    background:
      linear-gradient(145deg, rgba(8, 115, 61, .08), var(--fd-bg-surface) 55%) !important;
  }

  body[data-fd-player-surface="home"] > main {
    width: min(720px, calc(100% - 28px));
  }

  body[data-fd-player-surface="home"] > main > nav a,
  body[data-fd-player-surface="home"] .button {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="home"] .button.primary {
    background: linear-gradient(180deg, var(--fd-primary-hover), var(--fd-primary-strong)) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }

  body[data-fd-player-surface="home"] .button.demo {
    background: var(--fd-accent) !important;
    border-color: #c59e1b !important;
    color: #241e0c !important;
  }

  body[data-fd-player-surface="home"] .lead {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="home"] .note {
    border-color: var(--fd-border) !important;
    color: var(--fd-text-muted) !important;
  }

  body[data-fd-player-surface="schedule"] .round-head,
  body[data-fd-player-surface="schedule"] .match-top,
  body[data-fd-player-surface="schedule"] .versus span {
    color: var(--fd-text-muted) !important;
  }

  body[data-fd-player-surface="schedule"] .versus strong {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="score-picker"] .selection,
  body[data-fd-player-surface="score-picker"] .list,
  body[data-fd-player-surface="lineup"] .card,
  body[data-fd-player-surface="availability"] .card {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
  }

  body[data-fd-player-surface="standings"] table,
  body[data-fd-player-surface="standings"] th,
  body[data-fd-player-surface="standings"] td {
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="messages"] .thread,
  body[data-fd-player-surface="messages"] .composer,
  body[data-fd-player-surface="messages"] .inbox {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
  }

  /* Breathing room above mobile dock. */
  body[data-fd-player-surface] .app {
    padding-bottom: max(28px, calc(16px + env(safe-area-inset-bottom))) !important;
  }

  @media (max-width: 720px) {
    body[data-fd-player-surface] .app {
      padding-bottom: max(92px, calc(72px + env(safe-area-inset-bottom))) !important;
    }

    body[data-fd-player-surface="schedule"] .matches,
    body[data-fd-player-surface="schedule"] .controls,
    body[data-fd-player-surface="score-picker"] .filters,
    body[data-fd-player-surface="profile"] .grid,
    body[data-fd-player-surface="profile"] .actions,
    body[data-fd-player-surface="teams"] .hub-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    body[data-fd-player-surface="teams"] .action-card--primary {
      grid-column: auto !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    body[data-fd-player-surface] *,
    body[data-fd-player-surface] *::before,
    body[data-fd-player-surface] *::after {
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
    }
  }

  @media (forced-colors: active) {
    body[data-fd-player-surface] a,
    body[data-fd-player-surface] button,
    body[data-fd-player-surface] input,
    body[data-fd-player-surface] select,
    body[data-fd-player-surface] .panel,
    body[data-fd-player-surface] .match,
    body[data-fd-player-surface] .filters,
    body[data-fd-player-surface] .status,
    body[data-fd-player-surface] .empty {
      forced-color-adjust: auto;
      border-color: CanvasText !important;
    }
  }
`;

function surfaceForPath(pathname) {
  const exact = PLAYER_SURFACES.get(pathname);
  if (exact) return exact;
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/admin')) return '';
  if (pathname.startsWith('/scorecard')) return 'score-picker';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/teams') || pathname.startsWith('/trades')) return 'teams';
  if (pathname.startsWith('/standings') || pathname.startsWith('/prizes')) return 'standings';
  return PLAYER_SURFACES.get(pathname) || '';
}

export async function injectPlayerSurfaceTheme(response, pathname) {
  const surface = surfaceForPath(pathname);
  if (!surface) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-player-surface-theme')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  html = html.replace(/<body([^>]*)>/i, `<body$1 data-fd-player-surface="${surface}">`);
  const themeHead = `<meta name="theme-color" content="#f3f1ed" />
<style data-fd-player-surface-theme>${playerSurfaceThemeStyles}</style>
  body[data-fd-player-surface] .status:empty {
    display: none !important;
  }
  body[data-fd-player-surface] .empty {
    text-align: left !important;
    border-radius: var(--fd-radius-control) !important;
  }
  body[data-fd-player-surface] .match-actions a {
    font-weight: 700 !important;
    border-radius: var(--fd-radius-control) !important;
  }
  body[data-fd-player-surface] .status-pill {
    text-transform: none !important;
    font-weight: 700 !important;
  }
`;
  if (/name="theme-color"/i.test(html)) {
    html = html.replace(/<meta\s+name="theme-color"[^>]*>/i, '<meta name="theme-color" content="#f3f1ed" />');
    html = html.replace('</head>', `<style data-fd-player-surface-theme>${playerSurfaceThemeStyles}</style></head>`);
  } else {
    html = html.replace('</head>', `${themeHead}</head>`);
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
