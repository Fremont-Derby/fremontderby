export const designSystemStyles = `
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
    --fd-shadow: 0 8px 22px rgba(25, 31, 27, .11);
    --fd-shadow-soft: 0 3px 10px rgba(25, 31, 27, .08);
    --fd-radius: 16px;
    --fd-radius-sm: 11px;
  }
  html { background: var(--fd-page) !important; }
  body {
    margin: 0;
    min-height: 100vh;
    overflow-x: hidden;
    background: var(--fd-page) !important;
    color: var(--fd-ink) !important;
  }
  body, button, input, select, textarea { font-family: inherit !important; }
  main { color: var(--fd-ink); }
  h1, h2, h3, h4, strong, th { color: var(--fd-ink); }
  p, li, small, .muted, [class*="muted"] { color: var(--fd-muted); }
  a { color: var(--fd-green-800); }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible {
    outline: 3px solid #71b88e !important;
    outline-offset: 2px !important;
  }

  .fd-shell {
    background:
      repeating-linear-gradient(92deg, rgba(255,255,255,.025) 0 1px, transparent 1px 5px),
      linear-gradient(180deg, #0a4a2d, #06371f) !important;
    border-bottom: 4px solid var(--fd-wood) !important;
    color: #fff !important;
    box-shadow: 0 2px 8px rgba(0,0,0,.16) !important;
    backdrop-filter: none !important;
  }
  .fd-shell__inner { min-height: 64px !important; }
  .fd-brand { color: #fff !important; font-size: 1.05rem !important; }
  .fd-brand__ball {
    width: 32px !important; height: 32px !important;
    background: #111 !important; color: #fff !important; border-color: #fff !important;
    box-shadow: 0 1px 4px rgba(0,0,0,.3);
  }
  .fd-nav a { color: #eff8f2 !important; }
  .fd-nav a:hover { background: rgba(255,255,255,.12) !important; color:#fff !important; }
  .fd-nav a[aria-current="page"] { background: #fff !important; color: var(--fd-green-950) !important; border-color:#fff !important; }
  .fd-message-indicator, .fd-nav-menu summary {
    background: rgba(255,255,255,.08) !important;
    border-color: rgba(255,255,255,.32) !important;
    color: #fff !important;
  }
  .fd-nav--mobile, .fd-message-preview {
    background: #fff !important;
    border-color: var(--fd-line) !important;
    color: var(--fd-ink) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-nav--mobile a, .fd-message-preview a, .fd-message-preview__label { color: var(--fd-ink) !important; }
  .fd-message-preview__body, .fd-message-preview__time, .fd-message-preview__empty { color: var(--fd-muted) !important; }

  main, .app, .wrap, .container { max-width: 1100px; }
  .card, .panel, .hero, .step, .round, .scoreboard, .race, .team-score, .ledger-panel,
  .edit-panel, .reconcile, .details, details, article[class*="card"], section[class*="card"] {
    background: var(--fd-surface) !important;
    border-color: var(--fd-line) !important;
    color: var(--fd-ink) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .hero, .card, .panel, .scoreboard, .race, .team-score, .ledger-panel, .edit-panel, .reconcile, details {
    border-radius: var(--fd-radius) !important;
  }
  hr, table, th, td, .pairing, [class*="divider"] { border-color: var(--fd-line) !important; }
  table { background: var(--fd-surface) !important; color: var(--fd-ink) !important; }
  th { background: #f3f4f2 !important; color: #555b57 !important; }
  td { color: var(--fd-ink) !important; }
  tr:nth-child(even) td { background: #fbfbfa; }

  button, .button, a.button, [role="button"] {
    min-height: 46px;
    border-radius: var(--fd-radius-sm) !important;
    border-color: #bfc5c1 !important;
    background: #fff !important;
    color: var(--fd-green-900) !important;
    font-weight: 800 !important;
    box-shadow: none !important;
  }
  button:hover:not(:disabled), .button:hover, a.button:hover { background: #f6f8f6 !important; }
  button.primary, .button.primary, .primary, .add-rack, .win, [data-primary-action] {
    background: linear-gradient(180deg, #0c7545, #075a34) !important;
    border-color: #064b2c !important;
    color: #fff !important;
  }
  button.gold, .button.demo, .confirm { background: #f0c944 !important; border-color:#d0a91f !important; color:#241e0c !important; }
  button.danger, .danger, .finalize { background: #fff !important; border-color:#d77770 !important; color:#a82e27 !important; }
  button.ghost, .ghost, .reset, .undo { background:#fff !important; color:var(--fd-ink) !important; border-color:var(--fd-line) !important; }
  button:disabled { opacity: .45 !important; }

  input, select, textarea {
    background: #fff !important;
    color: var(--fd-ink) !important;
    border: 1px solid #bfc5c1 !important;
    border-radius: 10px !important;
  }
  input::placeholder, textarea::placeholder { color: #929894 !important; }

  .status[data-tone="error"], [data-state="error"], .error, .error-popup, .fd-error-popup { color: #8f271f !important; }
  .error-popup, .fd-error-popup {
    background: #fff5f3 !important;
    border-color: #d85a50 !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-error-popup__copy strong { color:#8f271f !important; }
  .fd-error-popup__copy span { color:#7c423d !important; }

  .demo-banner, .sandbox {
    background: #fff3bf !important;
    color: #5e4b00 !important;
    border-color: #ddbd43 !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  .chip, .step-status, .tag, .badge {
    background: var(--fd-green-100) !important;
    border-color: #b6d4c1 !important;
    color: var(--fd-green-900) !important;
  }

  .opening-setup { background: transparent !important; border-color: transparent !important; box-shadow:none !important; }
  .opening-options { border: 1px solid #9aa19c; border-radius: 13px; overflow:hidden; gap:0 !important; background:#fff; }
  .opening-option { border:0 !important; border-radius:0 !important; background:#fff !important; color:var(--fd-ink) !important; }
  .opening-option[aria-pressed="true"] { background: var(--fd-green-800) !important; color:#fff !important; }

  .team-score { background:#fff !important; }
  .team-score-label, .race-context, .ledger-state, .player-meta { color:#646966 !important; }
  .team-points, .race-score strong { color:#111 !important; }
  .team-separator { color:#555 !important; }
  .player + .player { border-color:var(--fd-line) !important; }

  .ledger, .ledger th, .ledger td { border-color: #d8dad8 !important; }
  .ledger .row-label, .rack-head { background:#f8f8f6 !important; color:var(--fd-ink) !important; }
  .submission { background:#fff !important; color:var(--fd-ink) !important; }
  .submission[data-value="W"] { color:#08733d !important; }
  .submission[data-value="L"] { color:#c53a31 !important; }
  .rack-head[data-state="mismatch"], .submission[data-state="mismatch"], .rack-status[data-state="mismatch"] {
    background: var(--fd-red-soft) !important;
    color: var(--fd-red) !important;
  }
  .rack-head[data-state="pending"], .submission[data-state="pending"], .rack-status[data-state="pending"] {
    background:#fff7d8 !important;
    color:#80620b !important;
  }
  .game-chip { background:#111 !important; color:#fff !important; border-color:#111 !important; }

  .fd-mobile-dock {
    border: 1px solid #c9cecb !important;
    border-top: 3px solid var(--fd-wood) !important;
    background: rgba(255,255,255,.97) !important;
    box-shadow: var(--fd-shadow) !important;
  }
  .fd-mobile-dock a { color: #343936 !important; }
  .fd-mobile-dock a[aria-current="page"] { background: var(--fd-green-100) !important; }

  @media (max-width: 760px) {
    body { padding-bottom: env(safe-area-inset-bottom); }
    main { width: min(100% - 16px, 1100px) !important; }
    .fd-shell__inner { padding-left: 10px !important; padding-right: 10px !important; }
    .card, .panel, .hero, .scoreboard, .race, .team-score, .ledger-panel { border-radius: 14px !important; }
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
