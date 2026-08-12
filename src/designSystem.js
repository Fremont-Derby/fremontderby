export const designSystemStyles = `
  /* Tokens: raw palette stays stable; semantic aliases are the page/component contract. */
  :root {
    color-scheme: light !important;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;

    --fd-page: #f3f1ed;
    --fd-surface: #ffffff;
    --fd-surface-soft: #f8f7f4;
    --fd-ink: #171b19;
    --fd-muted: #666b68;
    --fd-line: #d7d9d7;
    --fd-green-950: #06341f;
    --fd-green-900: #074a2b;
    --fd-green-800: #096238;
    --fd-green-700: #0b7543;
    --fd-green-100: #e8f3ec;
    --fd-gold: #e1b82f;
    --fd-red: #cb3f35;
    --fd-red-soft: #fff0ed;
    --fd-wood: #8a4b25;

    --fd-bg-page: var(--fd-page);
    --fd-bg-surface: var(--fd-surface);
    --fd-bg-subtle: var(--fd-surface-soft);
    --fd-text: var(--fd-ink);
    --fd-text-muted: var(--fd-muted);
    --fd-border: var(--fd-line);
    --fd-border-control: #bfc5c1;
    --fd-primary: var(--fd-green-800);
    --fd-primary-hover: var(--fd-green-700);
    --fd-primary-strong: var(--fd-green-900);
    --fd-primary-text: #ffffff;
    --fd-accent: var(--fd-gold);
    --fd-accent-bg: #fff7d8;
    --fd-accent-text: #5e4b00;
    --fd-danger: var(--fd-red);
    --fd-danger-bg: var(--fd-red-soft);
    --fd-danger-text: #8f271f;
    --fd-warning: #80620b;
    --fd-warning-bg: #fff7d8;
    --fd-success: #08733d;
    --fd-success-bg: #edf7f0;
    --fd-focus: #71b88e;

    --fd-content-max: 1100px;
    --fd-control-min: 46px;
    --fd-control-lg: 48px;
    --fd-space-1: 4px;
    --fd-space-2: 8px;
    --fd-space-3: 12px;
    --fd-space-4: 16px;
    --fd-space-5: 24px;
    --fd-space-6: 32px;
    --fd-shadow: 0 8px 22px rgba(25, 31, 27, .11);
    --fd-shadow-soft: 0 3px 10px rgba(25, 31, 27, .08);
    --fd-radius: 16px;
    --fd-radius-sm: 11px;
    --fd-radius-pill: 999px;
  }

  /* Universal primitives. */
  html { background: var(--fd-bg-page) !important; }
  body {
    margin: 0;
    min-height: 100vh;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }
  body, button, input, select, textarea { font-family: inherit !important; }
  main { color: var(--fd-text); }
  h1, h2, h3, h4, strong, th { color: var(--fd-text); }
  p, li, small, .muted, [class*="muted"], .meta, .hint, .subhead { color: var(--fd-text-muted) !important; }
  a { color: var(--fd-primary); }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible {
    outline: 3px solid var(--fd-focus) !important;
    outline-offset: 2px !important;
  }
  main, .app, .wrap, .container { max-width: var(--fd-content-max); }

  /* Shared shell. Dark felt is navigation identity, not the whole page. */
  .fd-shell {
    background:
      repeating-linear-gradient(92deg, rgba(255,255,255,.025) 0 1px, transparent 1px 5px),
      linear-gradient(180deg, #0a4a2d, #06371f) !important;
    border-bottom: 4px solid var(--fd-wood) !important;
    color: var(--fd-primary-text) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,.16) !important;
    backdrop-filter: none !important;
  }
  .fd-shell__inner { min-height: 64px !important; }
  .fd-brand { color: var(--fd-primary-text) !important; font-size: 1.05rem !important; }
  .fd-brand__ball {
    width: 32px !important;
    height: 32px !important;
    background: #111 !important;
    color: var(--fd-primary-text) !important;
    border-color: var(--fd-primary-text) !important;
    box-shadow: 0 1px 4px rgba(0,0,0,.3);
  }
  .fd-nav a { color: #eff8f2 !important; }
  .fd-nav a:hover { background: rgba(255,255,255,.12) !important; color: var(--fd-primary-text) !important; }
  .fd-nav a[aria-current="page"] { background: var(--fd-bg-surface) !important; color: var(--fd-green-950) !important; border-color: var(--fd-bg-surface) !important; }
  .fd-message-indicator, .fd-nav-menu summary {
    background: rgba(255,255,255,.08) !important;
    border-color: rgba(255,255,255,.32) !important;
    color: var(--fd-primary-text) !important;
  }
  .fd-nav--mobile, .fd-message-preview {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-nav--mobile a, .fd-message-preview a, .fd-message-preview__label { color: var(--fd-text) !important; }
  .fd-message-preview__body, .fd-message-preview__time, .fd-message-preview__empty { color: var(--fd-text-muted) !important; }

  /* Shared surfaces. */
  .card, .panel, .hero, .step, .round, .scoreboard, .race, .team-score, .ledger-panel,
  .edit-panel, .reconcile, .details, details, .match, .metric, .state, .state-card, .page-state,
  article[class*="card"], section[class*="card"] {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .hero, .card, .panel, .scoreboard, .race, .team-score, .ledger-panel, .edit-panel, .reconcile,
  .match, .metric, .state, .state-card, .page-state, details {
    border-radius: var(--fd-radius) !important;
  }
  hr, table, th, td, .pairing, [class*="divider"] { border-color: var(--fd-border) !important; }
  table { background: var(--fd-bg-surface) !important; color: var(--fd-text) !important; }
  th { background: var(--fd-bg-subtle) !important; color: var(--fd-text-muted) !important; }
  td { color: var(--fd-text) !important; }
  tr:nth-child(even) td { background: var(--fd-bg-subtle); }

  /* Shared controls. */
  button, .button, a.button, .score-link, .action, .state-action, [role="button"] {
    min-height: var(--fd-control-min);
    border-radius: var(--fd-radius-sm) !important;
    border-color: var(--fd-border-control) !important;
    background: var(--fd-bg-surface) !important;
    color: var(--fd-primary-strong) !important;
    font-weight: 800 !important;
    box-shadow: none !important;
  }
  button:hover:not(:disabled), .button:hover, a.button:hover, .action:hover, .state-action:hover {
    background: var(--fd-bg-subtle) !important;
  }
  button.primary, .button.primary, .primary, .action.primary, .state-action:not(.secondary), .add-rack, .win,
  .send, .match-actions a.primary, [data-primary-action] {
    background: linear-gradient(180deg, var(--fd-primary-hover), var(--fd-primary-strong)) !important;
    border-color: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }
  button.gold, .button.demo, .confirm {
    background: var(--fd-accent) !important;
    border-color: #c59e1b !important;
    color: #241e0c !important;
  }
  button.danger, .danger, .finalize, .block, .team-remove, .action.revoke, .action.block {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-danger) !important;
    color: var(--fd-danger-text) !important;
  }
  button.ghost, .ghost, .reset, .undo, .secondary, .state-action.secondary {
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text) !important;
    border-color: var(--fd-border) !important;
  }
  button:disabled { opacity: .45 !important; }

  input, select, textarea {
    min-height: var(--fd-control-min);
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text) !important;
    border: 1px solid var(--fd-border-control) !important;
    border-radius: 10px !important;
  }
  input::placeholder, textarea::placeholder { color: #929894 !important; }

  /* Shared state language. */
  .status { color: var(--fd-text-muted) !important; }
  .status[data-tone="ok"], .status[data-tone="ready"], [data-state="success"] { color: var(--fd-success) !important; }
  .status[data-tone="error"], [data-state="error"], .error, .error-popup, .fd-error-popup { color: var(--fd-danger-text) !important; }
  .error-popup, .fd-error-popup, .state-card[data-tone="error"] {
    background: var(--fd-danger-bg) !important;
    border-color: var(--fd-danger) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-error-popup__copy strong { color: var(--fd-danger-text) !important; }
  .fd-error-popup__copy span { color: #7c423d !important; }
  .state-card[data-tone="warning"], .demo-banner, .sandbox {
    background: var(--fd-warning-bg) !important;
    color: var(--fd-accent-text) !important;
    border-color: var(--fd-accent) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .chip, .step-status, .tag, .badge, .side, .hub-team {
    background: var(--fd-green-100) !important;
    border-color: #b6d4c1 !important;
    color: var(--fd-primary-strong) !important;
    border-radius: var(--fd-radius-pill) !important;
  }
  .unread {
    background: var(--fd-accent) !important;
    color: #241e0c !important;
  }

  /* Legacy adapters: normalize repeated page-local vocab without rewriting markup or behavior. */
  .topbar, .head, .heading {
    color: var(--fd-text) !important;
    border-color: var(--fd-border) !important;
  }
  .brand, .topbar .brand, .head h1, .heading h1 { color: var(--fd-text) !important; }
  .mark {
    background: var(--fd-primary) !important;
    color: var(--fd-primary-text) !important;
    border-radius: 50% !important;
  }
  .kicker, .eyebrow, .state-kicker, .hub-kicker, .action-label, .section-label {
    color: var(--fd-primary) !important;
  }
  .page-state p, .state p, .state-card p, .round-meta, .match-top, .teams, .candidate-help, .thread-preview,
  .chat-title small, .empty p { color: var(--fd-text-muted) !important; }
  .page-state, .state, .state-card { border-top-color: var(--fd-primary) !important; }
  .empty {
    color: var(--fd-text-muted) !important;
    border-color: var(--fd-border) !important;
  }
  .empty strong { color: var(--fd-text) !important; }

  /* Home/public page adapter. */
  body > main > nav:not(.fd-nav):not(.fd-nav--mobile) {
    border-color: var(--fd-border) !important;
  }
  body > main > nav:not(.fd-nav):not(.fd-nav--mobile) a {
    background: var(--fd-bg-surface) !important;
    color: var(--fd-primary-strong) !important;
    border-color: var(--fd-border) !important;
  }
  .lead { color: var(--fd-text) !important; }
  .note { color: var(--fd-text-muted) !important; border-color: var(--fd-border) !important; }

  /* Schedule/Teams/Profile/Admin adapters. Keep grid/layout rules local. */
  .controls, .setup, .night-hub, .create, .search, .control { border-color: var(--fd-border) !important; }
  .round-head, .panel-head { border-color: var(--fd-border) !important; }
  .round-meta strong { color: var(--fd-text) !important; }
  .match { border-top-color: var(--fd-accent) !important; }
  .match a, .action-card, .chat-link, .signin, .back, .admin-actions a { color: var(--fd-primary-strong) !important; }
  .action-card {
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .action-card--primary { border-top-color: var(--fd-primary) !important; }
  .action-card strong, .action-card .action-cta { color: var(--fd-text) !important; }
  .action-card .action-meta { color: var(--fd-text-muted) !important; }
  .rating, .team-points, .race-score strong {
    background: var(--fd-bg-subtle) !important;
    color: var(--fd-text) !important;
    font-variant-numeric: tabular-nums;
  }
  .admin-tools { background: var(--fd-bg-surface) !important; border-color: var(--fd-border) !important; }
  .admin-actions a {
    background: var(--fd-bg-subtle) !important;
    border-color: var(--fd-border) !important;
  }
  .reason { background: var(--fd-danger-bg) !important; color: var(--fd-danger-text) !important; border-color: var(--fd-danger) !important; }

  /* Messages adapter: preserve the specialized chat geometry while removing the separate dark theme. */
  .layout, .threads, .chat, .composer, .mobile-picker, .new-direct, dialog {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
  }
  .threads, .composer, .new-direct { background: var(--fd-bg-subtle) !important; }
  .thread {
    background: transparent !important;
    color: var(--fd-text) !important;
    border-color: transparent !important;
  }
  .thread:hover, .thread[data-active="true"] { background: var(--fd-green-100) !important; border-color: var(--fd-border) !important; }
  .message { background: var(--fd-bg-subtle) !important; color: var(--fd-text) !important; border-color: var(--fd-border) !important; }
  .message.mine { background: var(--fd-green-100) !important; border-color: #b6d4c1 !important; }
  .message-meta, .report { color: var(--fd-text-muted) !important; }
  dialog::backdrop { background: rgba(6, 20, 12, .58) !important; }

  /* Scoring-specific contract. */
  .opening-setup { background: transparent !important; border-color: transparent !important; box-shadow: none !important; }
  .opening-options { border: 1px solid var(--fd-border-control); border-radius: 13px; overflow: hidden; gap: 0 !important; background: var(--fd-bg-surface); }
  .opening-option { border: 0 !important; border-radius: 0 !important; background: var(--fd-bg-surface) !important; color: var(--fd-text) !important; }
  .opening-option[aria-pressed="true"] { background: var(--fd-primary) !important; color: var(--fd-primary-text) !important; }

  .team-score { background: var(--fd-bg-surface) !important; }
  .team-score-label, .race-context, .ledger-state, .player-meta { color: var(--fd-text-muted) !important; }
  .team-points, .race-score strong { color: #111 !important; }
  .team-separator { color: var(--fd-text-muted) !important; }
  .player + .player { border-color: var(--fd-border) !important; }

  .ledger, .ledger th, .ledger td { border-color: var(--fd-border) !important; }
  .ledger .row-label, .rack-head { background: var(--fd-bg-subtle) !important; color: var(--fd-text) !important; }
  .submission { background: var(--fd-bg-surface) !important; color: var(--fd-text) !important; }
  .submission[data-value="W"] { color: var(--fd-success) !important; }
  .submission[data-value="L"] { color: var(--fd-danger) !important; }
  .rack-head[data-state="mismatch"], .submission[data-state="mismatch"], .rack-status[data-state="mismatch"] {
    background: var(--fd-danger-bg) !important;
    color: var(--fd-danger) !important;
  }
  .rack-head[data-state="pending"], .submission[data-state="pending"], .rack-status[data-state="pending"] {
    background: var(--fd-warning-bg) !important;
    color: var(--fd-warning) !important;
  }
  .game-chip { background: #111 !important; color: var(--fd-primary-text) !important; border-color: #111 !important; }

  .fd-mobile-dock {
    border: 1px solid var(--fd-border) !important;
    border-top: 3px solid var(--fd-wood) !important;
    background: rgba(255,255,255,.97) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-mobile-dock a { color: var(--fd-text) !important; }
  .fd-mobile-dock a[aria-current="page"] { background: var(--fd-green-100) !important; }

  /* Responsive guardrails. */
  @media (max-width: 760px) {
    body { padding-bottom: env(safe-area-inset-bottom); }
    main { width: min(100% - 16px, var(--fd-content-max)) !important; }
    .fd-shell__inner { padding-left: 10px !important; padding-right: 10px !important; }
    .card, .panel, .hero, .scoreboard, .race, .team-score, .ledger-panel, .match, .state, .state-card {
      border-radius: 14px !important;
    }
  }
`;

export async function injectDesignSystem(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes('data-fd-design-system')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  const styled = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-design-system>${designSystemStyles}</style>\n</head>`)
    : html;
  return new Response(styled, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
