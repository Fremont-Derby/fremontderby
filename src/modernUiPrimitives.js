export const modernUiPrimitiveStyles = `
  /* Onion 1: Fremont-native modern UI primitives. Layout only; semantic tokens own color. */
  .fd-catalog {
    width: min(960px, calc(100% - 24px));
    margin: 0 auto;
    padding: var(--fd-space-5) 0 calc(var(--fd-space-6) * 2);
    display: grid;
    gap: var(--fd-space-5);
  }
  .fd-catalog__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--fd-space-4);
  }
  .fd-catalog__section {
    display: grid;
    gap: var(--fd-space-3);
    align-content: start;
  }
  .fd-catalog__section > h2 {
    margin: 0;
    font-size: 1rem;
  }

  .fd-page-header {
    display: grid;
    gap: var(--fd-space-2);
    padding: var(--fd-space-5) 0 var(--fd-space-3);
  }
  .fd-page-header h1 {
    margin: 0;
    max-width: 18ch;
    font-size: clamp(2rem, 8vw, 3.4rem);
    line-height: .98;
    letter-spacing: -.035em;
  }
  .fd-page-header p {
    max-width: 58ch;
    margin: 0;
    font-size: 1rem;
    line-height: 1.55;
  }
  .fd-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: var(--fd-space-2);
    color: var(--fd-primary-strong) !important;
    font-size: .75rem;
    font-weight: 900;
    letter-spacing: .11em;
    text-transform: uppercase;
  }
  .fd-eyebrow::before {
    content: '';
    width: 12px;
    height: 12px;
    border: 3px solid var(--fd-primary);
    border-radius: 50%;
  }

  .fd-card {
    padding: var(--fd-space-4);
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius);
    background: var(--fd-bg-surface);
    box-shadow: var(--fd-shadow-soft);
  }
  .fd-card--quiet { background: var(--fd-bg-subtle); box-shadow: none; }
  .fd-card > :first-child { margin-top: 0; }
  .fd-card > :last-child { margin-bottom: 0; }

  .fd-list-row,
  .fd-match-row,
  .fd-person-row {
    min-height: var(--fd-control-min);
    display: flex;
    align-items: center;
    gap: var(--fd-space-3);
    padding: var(--fd-space-3) 0;
    border-bottom: 1px solid var(--fd-border);
  }
  .fd-list-row:last-child,
  .fd-match-row:last-child,
  .fd-person-row:last-child { border-bottom: 0; }
  .fd-list-row__main,
  .fd-match-row__main,
  .fd-person-row__main {
    min-width: 0;
    flex: 1;
    display: grid;
    gap: 2px;
  }
  .fd-list-row__meta,
  .fd-match-row__meta,
  .fd-person-row__meta {
    color: var(--fd-text-muted) !important;
    font-size: .82rem;
  }
  .fd-list-row__value,
  .fd-match-row__score {
    flex: 0 0 auto;
    color: var(--fd-text);
    font-weight: 900;
    font-variant-numeric: tabular-nums;
  }

  .fd-status {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: var(--fd-space-1);
    min-height: 28px;
    padding: 4px 9px;
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius-pill);
    background: var(--fd-bg-subtle);
    color: var(--fd-text-muted) !important;
    font-size: .75rem;
    font-weight: 850;
  }
  .fd-status--success { border-color: var(--fd-success); background: var(--fd-success-bg); color: var(--fd-success) !important; }
  .fd-status--warning { border-color: var(--fd-accent); background: var(--fd-warning-bg); color: var(--fd-warning) !important; }
  .fd-status--danger { border-color: var(--fd-danger); background: var(--fd-danger-bg); color: var(--fd-danger-text) !important; }

  .fd-segmented {
    min-height: var(--fd-control-min);
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    padding: 3px;
    border: 1px solid var(--fd-border-control);
    border-radius: var(--fd-radius-sm);
    background: var(--fd-bg-subtle);
  }
  .fd-segmented button {
    min-height: var(--fd-control-min);
    padding: 8px 14px;
    border: 0 !important;
    border-radius: calc(var(--fd-radius-sm) - 3px) !important;
    background: transparent !important;
    color: var(--fd-text) !important;
  }
  .fd-segmented button[aria-pressed="true"] {
    background: var(--fd-bg-surface) !important;
    color: var(--fd-primary-strong) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  .fd-action {
    min-height: var(--fd-control-min);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--fd-space-2);
    padding: 9px 15px;
    border: 1px solid var(--fd-border-control) !important;
    border-radius: var(--fd-radius-sm) !important;
    font-weight: 850 !important;
    text-decoration: none;
  }
  .fd-action--primary {
    border-color: var(--fd-primary-strong) !important;
    background: var(--fd-primary-strong) !important;
    color: var(--fd-primary-text) !important;
  }
  .fd-action--secondary {
    background: var(--fd-bg-surface) !important;
    color: var(--fd-primary-strong) !important;
  }
  .fd-action--danger {
    border-color: var(--fd-danger) !important;
    background: var(--fd-bg-surface) !important;
    color: var(--fd-danger-text) !important;
  }

  .fd-empty-state,
  .fd-error-state {
    display: grid;
    gap: var(--fd-space-2);
    padding: var(--fd-space-4);
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius);
    background: var(--fd-bg-subtle);
  }
  .fd-empty-state strong,
  .fd-error-state strong { font-size: 1rem; }
  .fd-empty-state p,
  .fd-error-state p { margin: 0; }
  .fd-error-state {
    border-color: var(--fd-danger);
    background: var(--fd-danger-bg);
  }
  .fd-error-state strong,
  .fd-error-state p { color: var(--fd-danger-text) !important; }

  .fd-match-row__teams {
    display: flex;
    align-items: baseline;
    gap: var(--fd-space-2);
    font-weight: 850;
  }
  .fd-match-row__versus { color: var(--fd-text-muted); font-size: .78rem; font-weight: 750; }

  .fd-person-row__avatar {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--fd-green-100);
    color: var(--fd-primary-strong);
    font-weight: 900;
  }

  .fd-score-panel {
    display: grid;
    gap: var(--fd-space-4);
    padding: var(--fd-space-4);
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius);
    background: var(--fd-bg-surface);
    box-shadow: var(--fd-shadow-soft);
  }
  .fd-score-panel__race {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--fd-space-3);
    text-align: center;
  }
  .fd-score-panel__player { min-width: 0; font-weight: 850; }
  .fd-score-panel__score {
    font-size: clamp(2rem, 10vw, 3rem);
    line-height: 1;
    font-weight: 950;
    letter-spacing: -.04em;
    font-variant-numeric: tabular-nums;
  }
  .fd-score-panel__target {
    color: var(--fd-text-muted) !important;
    font-size: .8rem;
    font-weight: 750;
    text-align: center;
  }

  .fd-rack-ledger {
    display: grid;
    grid-template-columns: repeat(6, minmax(36px, 1fr));
    gap: var(--fd-space-2);
  }
  .fd-rack-ledger__rack {
    min-height: 42px;
    display: grid;
    place-items: center;
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius-sm);
    background: var(--fd-bg-subtle);
    color: var(--fd-text);
    font-weight: 900;
  }
  .fd-rack-ledger__rack[data-result="win"] { border-color: var(--fd-success); background: var(--fd-success-bg); color: var(--fd-success); }
  .fd-rack-ledger__rack[data-result="loss"] { border-color: var(--fd-danger); background: var(--fd-danger-bg); color: var(--fd-danger-text); }

  @media (max-width: 680px) {
    .fd-catalog { width: min(100% - 16px, 960px); padding-top: var(--fd-space-4); }
    .fd-catalog__grid { grid-template-columns: 1fr; }
    .fd-page-header { padding-top: var(--fd-space-4); }
    .fd-rack-ledger { grid-template-columns: repeat(3, minmax(44px, 1fr)); }
  }

  @media (forced-colors: active) {
    .fd-card,
    .fd-status,
    .fd-segmented,
    .fd-action,
    .fd-empty-state,
    .fd-error-state,
    .fd-score-panel,
    .fd-rack-ledger__rack {
      border: 1px solid CanvasText !important;
      forced-color-adjust: auto;
    }
  }
`;
