const PLAYER_SURFACES = new Map([
  ['/', 'home'],
  ['/schedule', 'schedule'],
  ['/scorecard', 'score-picker'],
  ['/profile', 'profile'],
  ['/availability', 'availability'],
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

  body[data-fd-player-surface] .topbar,
  body[data-fd-player-surface] .head {
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface] .status {
    color: var(--fd-text-muted) !important;
  }

  body[data-fd-player-surface] .status[data-tone="error"] {
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
    color: var(--fd-danger-text) !important;
  }

  body[data-fd-player-surface] .status[data-tone="ok"],
  body[data-fd-player-surface] .status[data-tone="ready"] {
    color: var(--fd-success) !important;
  }

  body[data-fd-player-surface="home"] > main {
    width: min(720px, calc(100% - 28px));
  }

  body[data-fd-player-surface="home"] > main > nav {
    border-color: var(--fd-border) !important;
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

  body[data-fd-player-surface="schedule"] .controls {
    border-color: var(--fd-border) !important;
  }

  body[data-fd-player-surface="schedule"] select {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="schedule"] .round,
  body[data-fd-player-surface="schedule"] .match {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface="schedule"] .match {
    border-top-color: var(--fd-accent) !important;
  }

  body[data-fd-player-surface="schedule"] .match-actions a {
    min-height: var(--fd-control-min);
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="schedule"] .match-actions a.primary {
    background: linear-gradient(180deg, var(--fd-primary-hover), var(--fd-primary-strong)) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }

  body[data-fd-player-surface="score-picker"] .filters,
  body[data-fd-player-surface="score-picker"] .status,
  body[data-fd-player-surface="score-picker"] .empty,
  body[data-fd-player-surface="score-picker"] .match {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface="score-picker"] .filters select {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="score-picker"] .match:hover {
    border-color: var(--fd-primary) !important;
  }

  body[data-fd-player-surface="score-picker"] .side {
    background: var(--fd-green-100) !important;
    border: 1px solid #b6d4c1 !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="score-picker"] .button {
    min-height: var(--fd-control-min);
  }

  body[data-fd-player-surface="score-picker"] .button:not(.secondary) {
    background: linear-gradient(180deg, var(--fd-primary-hover), var(--fd-primary-strong)) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }

  body[data-fd-player-surface="score-picker"] .button.secondary {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="profile"] .panel,
  body[data-fd-player-surface="profile"] .admin-tools {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface="profile"] input {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="profile"] .rating {
    background: var(--fd-bg-subtle) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="profile"] .badge {
    background: var(--fd-green-100) !important;
    border: 1px solid #b6d4c1 !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="profile"] .admin-actions a {
    min-height: var(--fd-control-lg);
    background: var(--fd-bg-subtle) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="profile"] .ghost,
  body[data-fd-player-surface="profile"] .google {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="profile"] .danger {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-danger) !important;
    color: var(--fd-danger-text) !important;
  }

  body[data-fd-player-surface="availability"] .app,
  body[data-fd-player-surface="availability"] .panel,
  body[data-fd-player-surface="availability"] .recovery,
  body[data-fd-player-surface="availability"] .choice-card,
  body[data-fd-player-surface="availability"] .answer {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="availability"] .panel,
  body[data-fd-player-surface="availability"] .recovery,
  body[data-fd-player-surface="availability"] .choice-card {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  body[data-fd-player-surface="availability"] .answer {
    background: var(--fd-bg-subtle) !important;
    border-color: var(--fd-border) !important;
  }

  body[data-fd-player-surface="availability"] .intro h1,
  body[data-fd-player-surface="availability"] .context strong,
  body[data-fd-player-surface="availability"] .answer strong,
  body[data-fd-player-surface="availability"] .panel-head,
  body[data-fd-player-surface="availability"] .choice-card > strong {
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="availability"] .intro p,
  body[data-fd-player-surface="availability"] label,
  body[data-fd-player-surface="availability"] .context span,
  body[data-fd-player-surface="availability"] .answer span,
  body[data-fd-player-surface="availability"] .choice-copy,
  body[data-fd-player-surface="availability"] .empty,
  body[data-fd-player-surface="availability"] .recovery p {
    color: var(--fd-text-muted) !important;
  }

  body[data-fd-player-surface="availability"] select {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
    color: var(--fd-text) !important;
  }

  body[data-fd-player-surface="availability"] .badge {
    background: var(--fd-green-100) !important;
    border: 1px solid #b6d4c1 !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="availability"] .signin,
  body[data-fd-player-surface="availability"] .choice-team {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-strong) !important;
  }

  body[data-fd-player-surface="availability"] .choice-team.selected,
  body[data-fd-player-surface="availability"] .retry {
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }

  body[data-fd-player-surface="availability"] button:focus-visible,
  body[data-fd-player-surface="availability"] select:focus-visible,
  body[data-fd-player-surface="availability"] .signin:focus-visible {
    outline-color: var(--fd-focus) !important;
  }

  @media (max-width: 700px) {
    body[data-fd-player-surface] .app {
      width: 100% !important;
      max-width: 100% !important;
    }

    body[data-fd-player-surface="schedule"] .controls,
    body[data-fd-player-surface="schedule"] .matches,
    body[data-fd-player-surface="score-picker"] .filters,
    body[data-fd-player-surface="profile"] .grid,
    body[data-fd-player-surface="profile"] .actions,
    body[data-fd-player-surface="profile"] .profile-head,
    body[data-fd-player-surface="profile"] .admin-actions {
      grid-template-columns: minmax(0, 1fr) !important;
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
  html = html.replace(
    '</head>',
    `<style data-fd-player-surface-theme>${playerSurfaceThemeStyles}</style></head>`,
  );

  if (surface === 'home') {
    html = html.replace(
      '<meta name="theme-color" content="#07150f" />',
      '<meta name="theme-color" content="#f3f1ed" />',
    );
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
