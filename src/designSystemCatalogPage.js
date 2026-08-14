import { designSystemStyles } from './designSystem.js';

/** In-app design catalog (Storybook-lite). Not for league players; agents/ops use /design-system. */
export function renderDesignSystemCatalogPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Fremont Derby · Design system</title>
  <style>${designSystemStyles}
    .catalog { max-width: 960px; margin: 0 auto; padding: 24px 16px 64px; }
    .catalog h1 { margin: 0 0 8px; }
    .catalog .lede { margin: 0 0 28px; color: var(--fd-text-muted); }
    .swatch-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 28px; }
    .swatch { width: 120px; border: 1px solid var(--fd-border); border-radius: 10px; overflow: hidden; background: var(--fd-bg-surface); }
    .swatch i { display: block; height: 48px; }
    .swatch span { display: block; padding: 8px; font-size: .72rem; color: var(--fd-text-muted); }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 12px 0 24px; }
    .demo-select { max-width: 320px; }
  </style>
</head>
<body>
  <main class="catalog">
    <h1>Design system catalog</h1>
    <p class="lede">Storybook-lite for agents and operators. Product copy lives on real pages; this surface only shows tokens and chrome.</p>

    <h2>Color tokens</h2>
    <div class="swatch-row">
      <div class="swatch"><i style="background:var(--fd-bg-page)"></i><span>page</span></div>
      <div class="swatch"><i style="background:var(--fd-bg-surface)"></i><span>surface</span></div>
      <div class="swatch"><i style="background:var(--fd-primary-strong)"></i><span>primary</span></div>
      <div class="swatch"><i style="background:var(--fd-accent)"></i><span>accent</span></div>
      <div class="swatch"><i style="background:var(--fd-danger)"></i><span>danger</span></div>
      <div class="swatch"><i style="background:var(--fd-success)"></i><span>success</span></div>
    </div>

    <h2>Controls (rectangular)</h2>
    <div class="row">
      <label class="demo-select">Season
        <select aria-label="Demo season">
          <option>Season 1</option>
          <option>Season 2</option>
        </select>
      </label>
      <button type="button" class="primary">Primary</button>
      <button type="button" class="ghost">Ghost</button>
      <button type="button" class="danger">Danger</button>
    </div>

    <h2>Status (short pills vs rectangular status)</h2>
    <div class="row">
      <span class="status-pill" data-tone="live">Live</span>
      <span class="status-pill" data-tone="tonight">Tonight</span>
      <span class="badge ok">Ready</span>
      <span class="badge blocked">Blocked</span>
      <span class="status" data-tone="ok">Schedule up to date</span>
      <span class="status" data-tone="error">Could not save</span>
      <span class="status" data-tone="warning">Needs attention</span>
    </div>

    <h2>Token remap</h2>
    <p class="lede">Legacy <code>--panel / --line / --muted / --green</code> bind to <code>--fd-*</code> on player and admin surfaces via <code>src/tokenRemap.js</code>.</p>
  </main>
</body>
</html>`;
}
