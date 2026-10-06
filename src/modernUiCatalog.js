import { decorateHtmlWithShell } from './appShell.js';
import { modernUiPrimitiveStyles } from './modernUiPrimitives.js';

export function renderModernUiCatalog() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Modern UI Catalog · Fremont Derby</title>
  <style data-fd-modern-ui-primitives>${modernUiPrimitiveStyles}</style>
</head>
<body>
  <main class="fd-catalog" data-fd-ui-catalog="modern-v1">
    <header class="fd-page-header" data-fd-primitive="page-header">
      <span class="fd-eyebrow" data-fd-primitive="eyebrow">Fremont Derby · JFL</span>
      <h1>Modern UI building blocks</h1>
      <p>Small, reusable patterns for the JFL peel-the-onion migration. The catalog changes presentation only; league behavior stays in the existing domain and API layers.</p>
    </header>

    <section class="fd-catalog__grid" aria-label="Shared UI primitives">
      <section class="fd-catalog__section">
        <h2>Cards and compact rows</h2>
        <article class="fd-card" data-fd-primitive="card">
          <strong>Tonight at 4B's</strong>
          <p>Primary context belongs up front. Details stay compact and scannable.</p>
          <div class="fd-list-row" data-fd-primitive="list-row">
            <div class="fd-list-row__main">
              <strong>Table 2</strong>
              <span class="fd-list-row__meta">7:00 PM · Match ready</span>
            </div>
            <span class="fd-list-row__value">3 players</span>
          </div>
        </article>
      </section>

      <section class="fd-catalog__section">
        <h2>Status language</h2>
        <article class="fd-card" data-fd-primitive="status">
          <div class="fd-list-row">
            <span>Ready</span>
            <span class="fd-status fd-status--success" role="status">Confirmed</span>
          </div>
          <div class="fd-list-row">
            <span>Needs attention</span>
            <span class="fd-status fd-status--warning">Waiting</span>
          </div>
          <div class="fd-list-row">
            <span>Blocked</span>
            <span class="fd-status fd-status--danger">Mismatch</span>
          </div>
        </article>
      </section>

      <section class="fd-catalog__section">
        <h2>Segmented choice</h2>
        <div class="fd-card" data-fd-primitive="segmented-control">
          <div class="fd-segmented" role="group" aria-label="View sample">
            <button type="button" aria-pressed="true">Tonight</button>
            <button type="button" aria-pressed="false">Season</button>
          </div>
        </div>
      </section>

      <section class="fd-catalog__section">
        <h2>Actions</h2>
        <div class="fd-card" data-fd-primitive="action">
          <div class="fd-cluster">
            <button type="button" class="fd-action fd-action--primary">Continue</button>
            <button type="button" class="fd-action fd-action--secondary">Back</button>
            <button type="button" class="fd-action fd-action--danger">Remove</button>
          </div>
        </div>
      </section>

      <section class="fd-catalog__section">
        <h2>Empty and error states</h2>
        <div class="fd-empty-state" data-fd-primitive="empty-state">
          <strong>No matches tonight</strong>
          <p>Your next scheduled match will appear here.</p>
        </div>
        <div class="fd-error-state" data-fd-primitive="error-state" role="alert">
          <strong>Score mismatch</strong>
          <p>Compare the highlighted rack before confirming.</p>
        </div>
      </section>

      <section class="fd-catalog__section">
        <h2>Match row</h2>
        <article class="fd-card">
          <div class="fd-match-row" data-fd-primitive="match-row">
            <div class="fd-match-row__main">
              <div class="fd-match-row__teams"><span>Breakers</span><span class="fd-match-row__versus">vs</span><span>Corner Crew</span></div>
              <span class="fd-match-row__meta">Wednesday · 7 PM · Table 3</span>
            </div>
            <span class="fd-match-row__score">1–1</span>
          </div>
        </article>
      </section>

      <section class="fd-catalog__section">
        <h2>Person row</h2>
        <article class="fd-card">
          <div class="fd-person-row" data-fd-primitive="person-row">
            <span class="fd-person-row__avatar" aria-hidden="true">JL</span>
            <div class="fd-person-row__main">
              <strong>Jason Lambert</strong>
              <span class="fd-person-row__meta">Captain · 5 appearances</span>
            </div>
            <span class="fd-status fd-status--success">Eligible</span>
          </div>
        </article>
      </section>

      <section class="fd-catalog__section">
        <h2>Score and rack ledger</h2>
        <article class="fd-score-panel" data-fd-primitive="score-panel">
          <div class="fd-score-panel__race">
            <span class="fd-score-panel__player">Player A</span>
            <span class="fd-score-panel__score">5–2</span>
            <span class="fd-score-panel__player">Player B</span>
          </div>
          <div class="fd-score-panel__target">Race to 7 · 8-ball first</div>
          <div class="fd-rack-ledger" data-fd-primitive="rack-ledger" aria-label="Sample rack history">
            <span class="fd-rack-ledger__rack" data-result="win">W</span>
            <span class="fd-rack-ledger__rack" data-result="loss">L</span>
            <span class="fd-rack-ledger__rack" data-result="win">W</span>
            <span class="fd-rack-ledger__rack" data-result="win">W</span>
            <span class="fd-rack-ledger__rack">—</span>
            <span class="fd-rack-ledger__rack">—</span>
          </div>
        </article>
      </section>
    </section>
  </main>
</body>
</html>`;
}

export function routeModernUiCatalog(request, env = {}) {
  const url = new URL(request.url);
  if (url.pathname !== '/design-system') return null;
  if (env.ENVIRONMENT !== 'jfl') return null;
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  return new Response(decorateHtmlWithShell(renderModernUiCatalog(), url.pathname), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-catalog': 'modern-v1',
    },
  });
}
