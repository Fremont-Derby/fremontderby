export const standingsThemeStyles = `
  body[data-fd-standings-theme] {
    color-scheme: light !important;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }
  body[data-fd-standings-theme] *,
  body[data-fd-standings-theme] *::before,
  body[data-fd-standings-theme] *::after { min-width: 0; }
  body[data-fd-standings-theme] .topbar,
  body[data-fd-standings-theme] .tabs-wrap,
  body[data-fd-standings-theme] .tabs,
  body[data-fd-standings-theme] .panel,
  body[data-fd-standings-theme] th,
  body[data-fd-standings-theme] td,
  body[data-fd-standings-theme] .standing-card,
  body[data-fd-standings-theme] .metric { border-color: var(--fd-border) !important; }
  body[data-fd-standings-theme] .tabs-wrap {
    background: var(--fd-bg-page) !important;
  }
  body[data-fd-standings-theme] .tabs {
    background: var(--fd-bg-surface) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-standings-theme] .tab {
    color: var(--fd-primary-strong) !important;
    background: transparent !important;
    border-color: transparent !important;
  }
  body[data-fd-standings-theme] .tab[aria-selected="true"] {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
    box-shadow: none !important;
    font-weight: 950;
  }
  body[data-fd-standings-theme] label,
  body[data-fd-standings-theme] .status,
  body[data-fd-standings-theme] th,
  body[data-fd-standings-theme] .metric span,
  body[data-fd-standings-theme] .state-card p,
  body[data-fd-standings-theme] .empty,
  body[data-fd-standings-theme] .card-stat span { color: var(--fd-text-muted) !important; }
  body[data-fd-standings-theme] .status[data-tone="error"] { color: var(--fd-danger-text) !important; }
  body[data-fd-standings-theme] .status[data-tone="ok"] { color: var(--fd-success) !important; }
  body[data-fd-standings-theme] select {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-standings-theme] .load,
  body[data-fd-standings-theme] .register-link,
  body[data-fd-standings-theme] .state-action {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
    box-shadow: none !important;
  }
  body[data-fd-standings-theme] .state-card,
  body[data-fd-standings-theme] .summary,
  body[data-fd-standings-theme] .panel,
  body[data-fd-standings-theme] .standing-card,
  body[data-fd-standings-theme] .card-stat {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-standings-theme] .state-card { border-top-color: var(--fd-accent) !important; }
  body[data-fd-standings-theme] .metric strong,
  body[data-fd-standings-theme] .rank { color: var(--fd-text) !important; }
  body[data-fd-standings-theme] .card-rank {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-green-100) !important;
    border-color: #b6d4c1 !important;
  }
  body[data-fd-standings-theme] .badge {
    color: var(--fd-text) !important;
    background: var(--fd-bg-subtle) !important;
    border: 1px solid var(--fd-border) !important;
  }
  body[data-fd-standings-theme] .badge.ok {
    color: var(--fd-success) !important;
    background: var(--fd-success-bg) !important;
    border-color: #9bc9ab !important;
  }
  body[data-fd-standings-theme] .badge.warn {
    color: var(--fd-warning-text) !important;
    background: var(--fd-warning-bg) !important;
    border-color: var(--fd-warning) !important;
  }
  @media (max-width: 760px) {
    body[data-fd-standings-theme] .app { width: 100% !important; max-width: 100% !important; }
    body[data-fd-standings-theme] .controls,
    body[data-fd-standings-theme] .summary { grid-template-columns: minmax(0, 1fr) !important; }
    body[data-fd-standings-theme] .standing-card { box-shadow: none !important; }
  }
  @media (forced-colors: active) {
    body[data-fd-standings-theme] .tab,
    body[data-fd-standings-theme] select,
    body[data-fd-standings-theme] .load,
    body[data-fd-standings-theme] .state-card,
    body[data-fd-standings-theme] .summary,
    body[data-fd-standings-theme] .panel,
    body[data-fd-standings-theme] .standing-card {
      forced-color-adjust: auto;
      border-color: CanvasText !important;
    }
  }
`;

export async function injectStandingsTheme(response, pathname) {
  if (pathname !== '/standings') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-standings-theme')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  html = html.replace(/<body([^>]*)>/i, '<body$1 data-fd-standings-theme>');
  html = html.replace('</head>', `<style data-fd-standings-theme-styles>${standingsThemeStyles}</style></head>`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
