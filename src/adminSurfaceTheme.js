const ADMIN_SURFACES = new Map([
  ['/admin/players', 'players'],
  ['/admin/season-teams', 'season-teams'],
  ['/admin/operations', 'operations'],
  ['/season-setup', 'season-setup'],
]);

export const adminSurfaceThemeStyles = `
  body[data-fd-admin-surface] {
    color-scheme: light !important;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }
  body[data-fd-admin-surface] *,
  body[data-fd-admin-surface] *::before,
  body[data-fd-admin-surface] *::after { min-width: 0; }
  body[data-fd-admin-surface] .head,
  body[data-fd-admin-surface] .topbar,
  body[data-fd-admin-surface] .panel-head,
  body[data-fd-admin-surface] .create,
  body[data-fd-admin-surface] .control,
  body[data-fd-admin-surface] .seed,
  body[data-fd-admin-surface] .row { border-color: var(--fd-border) !important; }
  body[data-fd-admin-surface] .muted,
  body[data-fd-admin-surface] .sub,
  body[data-fd-admin-surface] label,
  body[data-fd-admin-surface] .meta,
  body[data-fd-admin-surface] .results-meta,
  body[data-fd-admin-surface] .empty,
  body[data-fd-admin-surface] .capacity span,
  body[data-fd-admin-surface] .metric span,
  body[data-fd-admin-surface] .row span,
  body[data-fd-admin-surface] th { color: var(--fd-text-muted) !important; }
  body[data-fd-admin-surface] input,
  body[data-fd-admin-surface] textarea,
  body[data-fd-admin-surface] select {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-admin-surface] .panel,
  body[data-fd-admin-surface] .card,
  body[data-fd-admin-surface] .metric,
  body[data-fd-admin-surface] .toolbar,
  body[data-fd-admin-surface] .state:not([data-tone="error"]):not([data-tone="ok"]),
  body[data-fd-admin-surface] .status:not([data-tone="critical"]):not([data-tone="warning"]):not([data-tone="healthy"]):not([data-tone="error"]):not([data-tone="ok"]),
  body[data-fd-admin-surface] .action {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-admin-surface] .back,
  body[data-fd-admin-surface] .roster-link,
  body[data-fd-admin-surface] .admin-links a,
  body[data-fd-admin-surface] .recovery a,
  body[data-fd-admin-surface] .links a,
  body[data-fd-admin-surface] .signin,
  body[data-fd-admin-surface] .ghost {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-admin-surface] .primary,
  body[data-fd-admin-surface] .search button,
  body[data-fd-admin-surface] .action.grant,
  body[data-fd-admin-surface] .action.restore,
  body[data-fd-admin-surface] .action.add,
  body[data-fd-admin-surface] .add,
  body[data-fd-admin-surface] .create button {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
  }
  body[data-fd-admin-surface] .secondary,
  body[data-fd-admin-surface] .captain,
  body[data-fd-admin-surface] .captain-picker button,
  body[data-fd-admin-surface] .tab[aria-pressed="true"] {
    color: #241e0c !important;
    background: var(--fd-accent) !important;
    border-color: #c59e1b !important;
  }
  body[data-fd-admin-surface] .tab,
  body[data-fd-admin-surface] .letter-index button {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-admin-surface] .letter-index button[aria-pressed="true"] {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
  }
  body[data-fd-admin-surface] .badge,
  body[data-fd-admin-surface] .severity[data-severity="healthy"] {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-green-100) !important;
    border: 1px solid #b6d4c1 !important;
  }
  body[data-fd-admin-surface] .badge.admin,
  body[data-fd-admin-surface] .badge.unclaimed,
  body[data-fd-admin-surface] .severity[data-severity="warning"] {
    color: var(--fd-warning-text) !important;
    background: var(--fd-warning-bg) !important;
    border-color: var(--fd-warning) !important;
  }
  body[data-fd-admin-surface] .badge.blocked,
  body[data-fd-admin-surface] .reason,
  body[data-fd-admin-surface] .severity[data-severity="critical"] {
    color: var(--fd-danger-text) !important;
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
  }
  body[data-fd-admin-surface] .status[data-tone="error"],
  body[data-fd-admin-surface] .status[data-tone="critical"],
  body[data-fd-admin-surface] .state[data-tone="error"] {
    color: var(--fd-danger-text) !important;
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
  }
  body[data-fd-admin-surface] .status[data-tone="warning"] {
    color: var(--fd-warning-text) !important;
    background: var(--fd-warning-bg) !important;
    border-color: var(--fd-warning) !important;
  }
  body[data-fd-admin-surface] .status[data-tone="ok"],
  body[data-fd-admin-surface] .status[data-tone="healthy"],
  body[data-fd-admin-surface] .state[data-tone="ok"] {
    color: var(--fd-success) !important;
    background: var(--fd-success-bg) !important;
    border-color: #9bc9ab !important;
  }
  body[data-fd-admin-surface] .danger,
  body[data-fd-admin-surface] .action.revoke,
  body[data-fd-admin-surface] .action.block,
  body[data-fd-admin-surface] .team-remove {
    color: var(--fd-danger-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-danger) !important;
  }
  body[data-fd-admin-surface] .team,
  body[data-fd-admin-surface] .state {
    color: var(--fd-text) !important;
    border-color: var(--fd-border) !important;
  }
  body[data-fd-admin-surface] .notice {
    color: var(--fd-warning-text) !important;
    background: var(--fd-warning-bg) !important;
    border-color: var(--fd-warning) !important;
  }

  /* Operations severity remains structural: label + left rule + text. */
  body[data-fd-admin-surface="operations"] .action[data-severity="critical"] { border-left-color: var(--fd-danger) !important; }
  body[data-fd-admin-surface="operations"] .action[data-severity="warning"] { border-left-color: var(--fd-warning) !important; }
  body[data-fd-admin-surface="operations"] .action[data-severity="healthy"] { border-left-color: var(--fd-success) !important; }
  body[data-fd-admin-surface="operations"] button {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
  }

  @media (max-width: 900px) {
    body[data-fd-admin-surface] .app { width: 100% !important; max-width: 100% !important; }
    body[data-fd-admin-surface="season-setup"] .panel { overflow-x: auto; }
  }
  @media (prefers-reduced-motion: reduce) {
    body[data-fd-admin-surface] *,
    body[data-fd-admin-surface] *::before,
    body[data-fd-admin-surface] *::after {
      transition-duration: .01ms !important;
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
  @media (forced-colors: active) {
    body[data-fd-admin-surface] a,
    body[data-fd-admin-surface] button,
    body[data-fd-admin-surface] input,
    body[data-fd-admin-surface] select,
    body[data-fd-admin-surface] textarea,
    body[data-fd-admin-surface] .panel,
    body[data-fd-admin-surface] .card,
    body[data-fd-admin-surface] .metric,
    body[data-fd-admin-surface] .toolbar,
    body[data-fd-admin-surface] .status,
    body[data-fd-admin-surface] .state {
      forced-color-adjust: auto;
      border-color: CanvasText !important;
    }
  }
`;

export async function injectAdminSurfaceTheme(response, pathname) {
  const surface = ADMIN_SURFACES.get(pathname) || '';
  if (!surface) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-admin-surface-theme')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-fd-admin-surface="${surface}">`);
  html = html.replace('</head>', `<style data-fd-admin-surface-theme>${adminSurfaceThemeStyles}</style></head>`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
