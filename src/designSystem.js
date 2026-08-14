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
    --fd-radius-control: 10px;
    --fd-radius-pill: 999px;
    /* WCAG-oriented status chip pairs (bg + text). */
    --fd-pill-neutral-bg: #eef1ef;
    --fd-pill-neutral-text: #1f2923;
    --fd-pill-success-bg: #d8f0e2;
    --fd-pill-success-text: #0b4d2c;
    --fd-pill-warning-bg: #f7e7a8;
    --fd-pill-warning-text: #4a3b00;
    --fd-pill-danger-bg: #f8d7d4;
    --fd-pill-danger-text: #7a221c;
    --fd-pill-info-bg: #d9e8fc;
    --fd-pill-info-text: #0b3a6e;
    --fd-touch-min: 44px;
  }


  /* UX: clearer focus and denser readable status chips when pages opt in. */
  :focus-visible {
    outline: 3px solid var(--fd-focus) !important;
    outline-offset: 2px !important;
  }
  ::selection {
    background: #cfe8d8;
    color: var(--fd-ink);
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
  .fd-shell .fd-nav a { min-height: 44px !important; color: #eff8f2 !important; }
  .fd-nav a:hover { background: rgba(255,255,255,.12) !important; color: var(--fd-primary-text) !important; }
  .fd-nav a[aria-current="page"] { background: var(--fd-bg-surface) !important; color: var(--fd-green-950) !important; border-color: var(--fd-bg-surface) !important; }
  .fd-message-indicator, .fd-nav-menu summary {
    min-width: 44px !important;
    min-height: 44px !important;
    background: rgba(255,255,255,.08) !important;
    border-color: rgba(255,255,255,.32) !important;
    color: var(--fd-primary-text) !important;
  }
  .fd-message-indicator { width: 44px !important; height: 44px !important; }
  .fd-nav--mobile, .fd-message-preview {
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    color: var(--fd-text) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-nav--mobile a, .fd-message-preview a, .fd-message-preview__label { color: var(--fd-text) !important; }
  .fd-message-preview__body, .fd-message-preview__time, .fd-message-preview__empty { color: var(--fd-text-muted) !important; }
  .fd-message-preview__all { min-height: 44px !important; }

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

  /* Controls = soft rectangles. Status = short pills. See docs/ux-controls-and-status.md */
  input, select, textarea {
    min-height: max(var(--fd-control-min), var(--fd-touch-min));
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 10px 12px !important;
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text) !important;
    border: 1px solid var(--fd-border-control) !important;
    border-radius: var(--fd-radius-control) !important;
    font-size: 16px !important; /* iOS: avoid focus zoom */
    line-height: 1.25 !important;
    appearance: none;
    -webkit-appearance: none;
  }
  select {
    padding-right: 36px !important;
    background-image:
      linear-gradient(45deg, transparent 50%, var(--fd-text-muted) 50%),
      linear-gradient(135deg, var(--fd-text-muted) 50%, transparent 50%);
    background-position:
      calc(100% - 18px) calc(50% - 3px),
      calc(100% - 12px) calc(50% - 3px);
    background-size: 6px 6px, 6px 6px;
    background-repeat: no-repeat;
  }
  input::placeholder, textarea::placeholder { color: #929894 !important; }

  button, .button, a.button, .score-link, .action, .state-action, [role="button"] {
    min-height: max(var(--fd-control-min), var(--fd-touch-min));
    min-width: var(--fd-touch-min);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  /* Shared state language — long status copy is rectangular, not a stadium pill. */
  .status {
    display: inline-flex !important;
    align-items: center !important;
    max-width: 100%;
    min-height: 34px;
    padding: 6px 12px !important;
    border-radius: var(--fd-radius-control) !important;
    border: 1px solid var(--fd-border) !important;
    background: var(--fd-bg-surface) !important;
    color: var(--fd-text-muted) !important;
    font-weight: 700 !important;
  }
  .status[data-tone="ok"], .status[data-tone="ready"], [data-state="success"] {
    color: var(--fd-pill-success-text) !important;
    background: var(--fd-pill-success-bg) !important;
    border-color: #b7dfc5 !important;
  }
  .status[data-tone="error"], [data-state="error"], .error, .error-popup, .fd-error-popup {
    color: var(--fd-danger-text) !important;
  }
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

  /* Short tokens only — not long filter labels or team names. */
  .chip, .step-status, .tag, .badge, .side, .status-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px;
    min-height: 28px;
    max-width: 100%;
    padding: 4px 10px !important;
    border: 1px solid transparent !important;
    border-radius: var(--fd-radius-pill) !important;
    background: var(--fd-pill-neutral-bg) !important;
    color: var(--fd-pill-neutral-text) !important;
    font-weight: 800 !important;
    font-size: .78rem !important;
    line-height: 1.2 !important;
    letter-spacing: .01em;
  }
  .chip[data-tone="ok"], .badge.ok, .badge.ready, .status-pill[data-tone="live"] {
    background: var(--fd-pill-success-bg) !important;
    color: var(--fd-pill-success-text) !important;
    border-color: #b7dfc5 !important;
  }
  .chip[data-tone="warn"], .badge.warn, .status-pill[data-tone="tonight"] {
    background: var(--fd-pill-warning-bg) !important;
    color: var(--fd-pill-warning-text) !important;
    border-color: #e2c86a !important;
  }
  .chip[data-tone="danger"], .badge.blocked, .badge.unclaimed {
    background: var(--fd-pill-danger-bg) !important;
    color: var(--fd-pill-danger-text) !important;
    border-color: #efb4ae !important;
  }
  .chip[data-tone="info"], .badge.admin, .status-pill[data-tone="done"] {
    background: var(--fd-pill-info-bg) !important;
    color: var(--fd-pill-info-text) !important;
    border-color: #b4ccee !important;
  }
  /* Team/filter chrome is a control row, not a pill. */
  .hub-team {
    border-radius: var(--fd-radius-control) !important;
    background: var(--fd-bg-subtle) !important;
    color: var(--fd-text) !important;
    border: 1px solid var(--fd-border) !important;
    min-height: var(--fd-touch-min);
    padding: 8px 12px !important;
  }
  .unread {
    background: var(--fd-accent) !important;
    color: #241e0c !important;
  }

  @media (max-width: 720px) {
    label:has(select),
    label:has(input),
    .filters select,
    .controls select,
    .topbar select {
      display: block;
      width: 100%;
    }
    select, input[type="text"], input[type="search"], input[type="tel"] {
      width: 100% !important;
    }
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
  .layout .panel-actions button, .layout .block, .layout .older, .layout .report {
    min-width: 44px !important;
    min-height: 44px !important;
  }
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

  @media (forced-colors: active) {
    .fd-shell .fd-nav a, .fd-message-indicator, .fd-nav-menu summary, .fd-message-preview__all,
    .layout .panel-actions button, .layout .block, .layout .older, .layout .report {
      border: 1px solid ButtonText !important;
      forced-color-adjust: auto;
    }
  }

  /* Responsive guardrails. */
  @media (max-width: 760px) {
    body { padding-bottom: env(safe-area-inset-bottom); }
    main { width: min(100% - 16px, var(--fd-content-max)) !important; }
    .fd-shell__inner { padding-left: 10px !important; padding-right: 10px !important; }
    .card, .panel, .hero, .scoreboard, .race, .team-score, .ledger-panel, .match, .state, .state-card {
      border-radius: 14px !important;
    }
  }


  /* ——— Professional polish (chrome only; product copy unchanged) ——— */
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Quieter default type hierarchy */
  h1 { font-weight: 800 !important; letter-spacing: -0.02em !important; line-height: 1.15 !important; }
  h2 { font-weight: 700 !important; letter-spacing: -0.015em !important; }
  h3, h4 { font-weight: 700 !important; }

  /* Soften ultra-black weights used in page-local CSS */
  button, .button, a.button, .action, .tab, .badge, .chip, .status-pill, .match-actions a {
    font-weight: 700 !important;
  }

  /* Status strip: calm, professional, no “system boot” energy */
  .status {
    font-size: 0.84rem !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
  }
  .status:empty {
    display: none !important;
    padding: 0 !important;
    border: 0 !important;
    min-height: 0 !important;
  }

  /* Empty states: left-aligned readable blocks, not floating alarm text */
  .empty, .page-state, .state-card {
    text-align: left !important;
    border-radius: var(--fd-radius) !important;
    border: 1px solid var(--fd-border) !important;
    background: var(--fd-bg-surface) !important;
    padding: 20px 18px !important;
    color: var(--fd-text-muted) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .empty a, .page-state a, .state-card a {
    font-weight: 700 !important;
    text-decoration: underline !important;
    text-underline-offset: 2px;
  }

  /* Panels / cards: consistent elevation */
  .panel, .card, .match, .action-card, .ledger-panel, .edit-panel {
    border: 1px solid var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  /* Tables: cleaner league-ops look */
  table {
    border-collapse: separate !important;
    border-spacing: 0 !important;
    overflow: hidden;
    border: 1px solid var(--fd-border) !important;
    border-radius: var(--fd-radius-sm) !important;
  }
  th, td {
    padding: 12px 14px !important;
    border-bottom: 1px solid var(--fd-border) !important;
  }
  tr:last-child td { border-bottom: 0 !important; }
  th {
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
  }

  /* Interactive transitions without flashy motion */
  button, .button, a.button, .action, select, input, textarea, .tab, .match-actions a, .action-card {
    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease !important;
  }

  /* Native select: professional closed state */
  select:disabled {
    opacity: 0.65 !important;
    cursor: not-allowed;
  }

  /* Reduce harsh uppercase micro-labels where page CSS forced them on chrome */
  .status-pill {
    letter-spacing: 0.02em !important;
    text-transform: none !important;
    font-weight: 700 !important;
  }

  /* Loading placeholders in selects stay muted, not bold alarm */
  select:disabled option {
    color: var(--fd-text-muted) !important;
  }

  /* Mobile denser rhythm */
  @media (max-width: 720px) {
    h1 { font-size: 1.55rem !important; }
    .panel, .card, .match { border-radius: 14px !important; }
    th, td { padding: 11px 12px !important; }
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
