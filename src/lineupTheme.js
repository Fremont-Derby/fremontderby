export const lineupThemeStyles = `
  body[data-fd-lineup-theme] {
    color-scheme: light !important;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }
  body[data-fd-lineup-theme] *,
  body[data-fd-lineup-theme] *::before,
  body[data-fd-lineup-theme] *::after { min-width: 0; }
  body[data-fd-lineup-theme] .topbar,
  body[data-fd-lineup-theme] .panel-head,
  body[data-fd-lineup-theme] .committed-row { border-color: var(--fd-border) !important; }
  body[data-fd-lineup-theme] .status,
  body[data-fd-lineup-theme] .setup label,
  body[data-fd-lineup-theme] .search-label,
  body[data-fd-lineup-theme] .meta,
  body[data-fd-lineup-theme] .slot-main span,
  body[data-fd-lineup-theme] .hint,
  body[data-fd-lineup-theme] .empty { color: var(--fd-text-muted) !important; }
  body[data-fd-lineup-theme] input,
  body[data-fd-lineup-theme] select {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-lineup-theme] .panel,
  body[data-fd-lineup-theme] .player,
  body[data-fd-lineup-theme] .slot,
  body[data-fd-lineup-theme] .mobile-lineup-summary,
  body[data-fd-lineup-theme] .mobile-slot {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-lineup-theme] .section-title,
  body[data-fd-lineup-theme] .player-name { color: var(--fd-text) !important; }
  body[data-fd-lineup-theme] .slot-number,
  body[data-fd-lineup-theme] .mobile-slot strong {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-green-100) !important;
  }
  body[data-fd-lineup-theme] .badge {
    color: var(--fd-text) !important;
    background: var(--fd-bg-subtle) !important;
    border: 1px solid var(--fd-border) !important;
  }
  body[data-fd-lineup-theme] .badge.available,
  body[data-fd-lineup-theme] .badge.paid {
    color: var(--fd-success) !important;
    background: var(--fd-success-bg) !important;
    border-color: var(--fd-success) !important;
  }
  body[data-fd-lineup-theme] .badge.unsure {
    color: var(--fd-warning-text) !important;
    background: var(--fd-warning-bg) !important;
    border-color: var(--fd-warning) !important;
  }
  body[data-fd-lineup-theme] .badge.unavailable,
  body[data-fd-lineup-theme] .badge.blocked {
    color: var(--fd-danger-text) !important;
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
  }
  body[data-fd-lineup-theme] .add,
  body[data-fd-lineup-theme] .submit,
  body[data-fd-lineup-theme] .mobile-lineup-lock {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
  }
  body[data-fd-lineup-theme] .load,
  body[data-fd-lineup-theme] .score-link {
    color: var(--fd-accent-text) !important;
    background: var(--fd-accent) !important;
    border-color: var(--fd-warning) !important;
    box-shadow: none !important;
  }
  body[data-fd-lineup-theme] .refresh,
  body[data-fd-lineup-theme] .slot-actions button,
  body[data-fd-lineup-theme] .signin {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-lineup-theme] .slot-actions .remove,
  body[data-fd-lineup-theme] .forfeit {
    color: var(--fd-danger-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-danger) !important;
  }
  body[data-fd-lineup-theme] .lock-note { color: var(--fd-success) !important; }
  body[data-fd-lineup-theme] .status[data-tone="ok"] { color: var(--fd-success) !important; }
  body[data-fd-lineup-theme] .status[data-tone="error"] {
    color: var(--fd-danger-text) !important;
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  body[data-fd-lineup-theme] .status-close {
    color: var(--fd-danger-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-danger) !important;
  }
  @media (max-width: 800px) {
    body[data-fd-lineup-theme] .app { width: 100% !important; max-width: 100% !important; }
    body[data-fd-lineup-theme] .mobile-lineup-summary {
      background: rgba(255,255,255,.97) !important;
      border-top: 3px solid var(--fd-wood) !important;
      box-shadow: var(--fd-shadow) !important;
      backdrop-filter: blur(10px);
    }
    body[data-fd-lineup-theme] .player { grid-template-columns: minmax(0,1fr) auto !important; }
  }
  @media (forced-colors: active) {
    body[data-fd-lineup-theme] a,
    body[data-fd-lineup-theme] button,
    body[data-fd-lineup-theme] input,
    body[data-fd-lineup-theme] select,
    body[data-fd-lineup-theme] .panel,
    body[data-fd-lineup-theme] .player,
    body[data-fd-lineup-theme] .slot,
    body[data-fd-lineup-theme] .mobile-lineup-summary {
      forced-color-adjust: auto;
      border-color: CanvasText !important;
    }
  }
`;

export async function injectLineupTheme(response, pathname) {
  if (pathname !== '/lineup') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-lineup-theme')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  html = html.replace(/<body([^>]*)>/i, '<body$1 data-fd-lineup-theme>');
  html = html.replace('</head>', `<style data-fd-lineup-theme-styles>${lineupThemeStyles}</style></head>`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
