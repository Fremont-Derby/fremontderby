export function renderPrizesPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Prizes</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #111316;
      color: #f5f1e9;
      --panel: #191d22;
      --line: #4b5560;
      --muted: #bac2c9;
      --green: #2fa972;
      --gold: #d8ad3f;
      --blue: #4e83d6;
      --red: #d45b50;
      --focus: #9ee5bd;
    }
    * { box-sizing: border-box; }
    input, select, textarea { font-size: 16px; }
    button, a, summary, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; min-height: 100vh; min-height: 100dvh; background: #111316; }
    button, select { font: inherit; }
    button {
      min-height: 44px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 850;
    }
    button:disabled, select:disabled { cursor: not-allowed; opacity: .62; }
    button:focus-visible, select:focus-visible, .state-action:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 3px;
    }
    .app { width: min(1120px, 100%); margin: 0 auto; padding: 16px; }
    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 950; }
    .mark {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--gold);
      color: #111316;
      font-weight: 950;
    }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    select {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1013;
      color: #f5f1e9;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); color: #12100a; padding: 0 16px; }
    .state-card {
      display: grid;
      gap: 10px;
      margin: 14px 0 0;
      padding: 18px;
      border: 1px solid var(--line);
      border-top: 4px solid var(--gold);
      border-radius: 10px;
      background: var(--panel);
    }
    .state-card[hidden] { display: none; }
    .state-card p { margin: 0; color: var(--muted); line-height: 1.5; }
    .state-action {
      width: max-content;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      border: 1px solid var(--green);
      border-radius: 8px;
      background: var(--green);
      color: #06120d;
      text-decoration: none;
      font-weight: 900;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding: 14px 0;
    }
    .metric {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      min-height: 88px;
      padding: 12px;
      display: grid;
      align-content: space-between;
      gap: 8px;
    }
    .metric span { color: var(--muted); font-size: .78rem; font-weight: 850; text-transform: uppercase; }
    .metric strong { font-size: 1.35rem; line-height: 1.1; overflow-wrap: anywhere; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
    .panel {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }
    .panel-head {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 0 12px;
      border-bottom: 1px solid var(--line);
      font-weight: 900;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      background: rgba(78, 131, 214, .18);
      color: #c9ddff;
      font-size: .78rem;
      font-weight: 900;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .numeric { text-align: right; font-variant-numeric: tabular-nums; }
    .empty { padding: 16px; color: var(--muted); }
    @media (max-width: 760px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; flex-direction: column; }
      .controls, .summary, .grid { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .load, .state-action { width: 100%; }
      .panel { overflow: hidden; }
      table { table-layout: auto; }
      thead { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
      tbody, tr, td { display: block; width: 100%; }
      tr { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); padding: 10px 12px; border-bottom: 1px solid var(--line); }
      tr:last-child { border-bottom: 0; }
      td { min-width: 0; padding: 7px 4px; border: 0; text-align: left; }
      td::before { display: block; margin-bottom: 2px; color: var(--muted); font-size: .68rem; font-weight: 850; text-transform: uppercase; }
      td:nth-child(1)::before { content: 'Pool'; }
      td:nth-child(2)::before { content: 'Place'; }
      td:nth-child(3)::before { content: 'Label'; }
      td:nth-child(4)::before { content: 'Amount'; }
      td.numeric { text-align: left; }
    }
    @media (max-width: 360px) {
      tr { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
    }
    @media (forced-colors: active) {
      button, select, .panel, .metric, .state-card, .state-action { border: 1px solid CanvasText; }
    }
  @media(max-width:720px){.app,main{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}}</style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">$</span><span>Fremont Derby Prizes</span></div>
      <div class="status" data-status aria-live="polite">Loading seasons…</div>
    </header>

    <form class="controls" data-form>
      <label>Season
        <select name="seasonId" data-season-id disabled><option value="">Loading seasons…</option></select>
      </label>
      <a class="ghost" href="/standings" style="min-height:44px;display:inline-flex;align-items:center">Standings</a>
      <a class="ghost" href="/teams" style="min-height:44px;display:inline-flex;align-items:center">Teams</a>
      <a class="ghost" href="/players" style="min-height:44px;display:inline-flex;align-items:center">Players</a>
      <button class="load" data-load type="submit" disabled>Load prizes</button>
    </form>

    <section class="state-card" data-page-state hidden aria-live="polite">
      <strong data-state-title></strong>
      <p data-state-detail></p>
      <a class="state-action" data-state-action href="/rules">View league rules</a>
    </section>

    <section class="summary" aria-label="Prize summary">
      <div class="metric"><span>Players</span><strong data-player-count>-</strong></div>
      <div class="metric"><span>Committed</span><strong data-committed>-</strong></div>
      <div class="metric"><span>Collected</span><strong data-collected>-</strong></div>
      <div class="metric"><span>Entry fee</span><strong data-entry-fee>-</strong></div>
      <div class="metric"><span>Administration</span><strong data-administration>-</strong></div>
      <div class="metric"><span>Prize pool</span><strong data-prize-pool>-</strong></div>
      <div class="metric"><span>Projected field</span><strong data-projected-field>-</strong></div>
      <div class="metric"><span>Team pool</span><strong data-team-pool>-</strong></div>
      <div class="metric"><span>Individual pool</span><strong data-individual-pool>-</strong></div>
    </section>

    <section class="panel" data-admin-finalize hidden>
      <div class="panel-head"><span>Admin finalize</span></div>
      <p class="muted">Locks payouts for this season using the current projected table. Requires league admin sign-in.</p>
      <button type="button" class="load" data-finalize>Finalize projected payouts</button>
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Projected payouts</span><span class="badge" data-config-version>-</span></div>
        <table>
          <thead>
            <tr><th>Pool</th><th>Place</th><th>Label</th><th class="numeric">Amount</th></tr>
          </thead>
          <tbody data-projected-body></tbody>
        </table>
        <div class="empty" data-projected-empty>No projected payouts loaded.</div>
      </article>

      <article class="panel">
        <p class="muted" style="margin:0 0 12px">Singles prize eligibility follows individual standings (minimum matches). Team prizes follow final team rank. Open Standings for the live “why” line on each player.</p>
        <div class="panel-head"><span>Finalized payouts</span><span class="badge" data-finalized-count>0</span></div>
        <table>
          <thead>
            <tr><th>Pool</th><th>Place</th><th>Label</th><th class="numeric">Amount</th></tr>
          </thead>
          <tbody data-finalized-body></tbody>
        </table>
        <div class="empty" data-finalized-empty>No finalized payouts loaded.</div>
      </article>
    </section>
  </main>

  <script>
    const form = document.querySelector('[data-form]');
    const seasonInput = document.querySelector('[data-season-id]');
    const loadButton = document.querySelector('[data-load]');
    const statusEl = document.querySelector('[data-status]');
    const pageState = document.querySelector('[data-page-state]');
    const stateTitle = document.querySelector('[data-state-title]');
    const stateDetail = document.querySelector('[data-state-detail]');
    const stateAction = document.querySelector('[data-state-action]');
    const projectedBody = document.querySelector('[data-projected-body]');
    const finalizedBody = document.querySelector('[data-finalized-body]');
    const projectedEmpty = document.querySelector('[data-projected-empty]');
    const finalizedEmpty = document.querySelector('[data-finalized-empty]');
    const fields = {
      playerCount: document.querySelector('[data-player-count]'),
      committed: document.querySelector('[data-committed]'),
      collected: document.querySelector('[data-collected]'),
      entryFee: document.querySelector('[data-entry-fee]'),
      administration: document.querySelector('[data-administration]'),
      prizePool: document.querySelector('[data-prize-pool]'),
      projectedField: document.querySelector('[data-projected-field]'),
      teamPool: document.querySelector('[data-team-pool]'),
      individualPool: document.querySelector('[data-individual-pool]'),
      configVersion: document.querySelector('[data-config-version]'),
      finalizedCount: document.querySelector('[data-finalized-count]'),
    };
    const query = new URLSearchParams(location.search);
    const requestedSeason = query.get('season') || '';
    const rememberedSeason = localStorage.getItem('fd.prizesSeasonId') || '';
    let lastSummary = null;
    const finalizePanel = document.querySelector('[data-admin-finalize]');
    const finalizeBtn = document.querySelector('[data-finalize]');

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function showState(title, detail, href = '/rules', label = 'View league rules') {
      stateTitle.textContent = title;
      stateDetail.textContent = detail;
      stateAction.href = href;
      stateAction.textContent = label;
      pageState.hidden = false;
    }

    function hideState() {
      pageState.hidden = true;
    }

    function money(cents) {
      const dollars = Number(cents || 0) / 100;
      return dollars.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
    }

    function cell(value, className) {
      const td = document.createElement('td');
      if (className) td.className = className;
      td.textContent = value == null || value === '' ? '-' : String(value);
      return td;
    }

    function renderPayoutRows(rows, body, emptyEl) {
      body.replaceChildren();
      emptyEl.hidden = rows.length > 0;
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.append(
          cell(row.pool),
          cell(row.place),
          cell(row.label),
          cell(money(row.amountCents), 'numeric'),
        );
        body.append(tr);
      }
    }

    function renderSummary(summary) {
      fields.playerCount.textContent = summary.player_count || 0;
      fields.committed.textContent = money(summary.committed_amount_cents);
      fields.collected.textContent = money(summary.paid_amount_cents);
      fields.entryFee.textContent = money(summary.entry_fee_cents);
      fields.administration.textContent = money(summary.administration_amount_cents);
      fields.prizePool.textContent = money(summary.projected_prize_pool_cents);
      fields.projectedField.textContent = summary.projected_field_size || '-';
      fields.teamPool.textContent = money(summary.team_prize_pool_cents);
      fields.individualPool.textContent = money(summary.individual_prize_pool_cents);
      fields.configVersion.textContent = summary.configuration_version
        ? 'v' + summary.configuration_version
        : 'unconfigured';
      fields.finalizedCount.textContent = String((summary.finalized_payouts || []).length);

      renderPayoutRows(summary.projected_payouts || [], projectedBody, projectedEmpty);
      renderPayoutRows(summary.finalized_payouts || [], finalizedBody, finalizedEmpty);
      lastSummary = summary;
      if (finalizePanel) {
        finalizePanel.hidden = !sessionStorage.getItem('fd.accessToken');
      }
    }

    function preferredSeason(seasons) {
      if (typeof choosePublicSeason === 'function') {
        return choosePublicSeason(seasons, { explicitId: requestedSeason, rememberedId: rememberedSeason });
      }
      const explicit = seasons.find((season) => season.id === requestedSeason);
      const remembered = seasons.find((season) => season.id === rememberedSeason);
      return explicit
        || remembered
        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))
        || seasons.find((season) => season.status === 'registration')
        || seasons.find((season) => season.status === 'complete')
        || seasons[0];
    }

    async function loadSeasons() {
      setStatus('Loading seasons…');
      hideState();
      seasonInput.disabled = true;
      loadButton.disabled = true;
      const response = await fetch('/api/seasons');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load seasons');
      const seasons = body.seasons || [];
      seasonInput.replaceChildren();
      if (!seasons.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No public seasons';
        seasonInput.append(opt);
        showState('No season yet', 'Prize information will appear here once a public season is available.');
        setStatus('No public season yet');
        return false;
      }
      for (const season of seasons) {
        const opt = document.createElement('option');
        opt.value = season.id;
        opt.textContent = season.name + ' — ' + String(season.status || 'season');
        seasonInput.append(opt);
      }
      const preferred = preferredSeason(seasons);
      seasonInput.value = preferred?.id || seasons[0].id;
      seasonInput.disabled = false;
      loadButton.disabled = false;
      return true;
    }

    async function loadPrizes(opts={}) {
      const quiet = Boolean(opts && opts.quiet);
      const seasonId = seasonInput.value.trim();
      if (!seasonId) return;
      if (!quiet) hideState();
      localStorage.setItem('fd.prizesSeasonId', seasonId);
      if (!quiet) setStatus('Loading prizes…');
      if (!quiet) loadButton.disabled = true;
      try {
        const response = await fetch('/api/seasons/' + encodeURIComponent(seasonId) + '/prizes');
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error || 'Prize summary failed');
        }
        renderSummary(body.summary || {});
        setStatus('Prizes loaded', 'ok');
      } finally {
        loadButton.disabled = seasonInput.disabled;
      }
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus((window.fdFriendlyError ? window.fdFriendlyError(error) : error.message), 'error');
        showState('Could not load prizes', error.message, '/prizes', 'Try again');
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run(loadPrizes);
    });

    run(async () => {
      const hasSeason = await loadSeasons();
      if (hasSeason) await loadPrizes();
    });
    seasonInput.addEventListener('change', () => run(loadPrizes));
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', () => run(async () => {
        const token = sessionStorage.getItem('fd.accessToken');
        if (!token) throw new Error('Sign in on Profile as a league admin first.');
        const seasonId = seasonInput.value;
        if (!seasonId) throw new Error('Choose a season');
        const projected = (lastSummary && lastSummary.projected_payouts) || [];
        if (!projected.length) throw new Error('No projected payouts to finalize');
        if (!confirm('Finalize ' + projected.length + ' projected payout rows for this season?')) return;
        setStatus('Finalizing prizes…');
        const response = await fetch('/api/admin/seasons/' + encodeURIComponent(seasonId) + '/prizes/finalize', {
          method: 'POST',
          headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
          body: JSON.stringify({
            finalizedPayouts: projected.map((row) => ({
              pool: row.pool,
              place: row.place,
              label: row.label,
              amountCents: row.amount_cents ?? row.amountCents,
            })),
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Finalize failed');
        await loadPrizes();
        setStatus('Prize payouts finalized', 'ok');
      }));
    }
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>run(()=>loadPrizes(opts)),{intervalMs:30000,immediate:false});
  </script>
</body>
</html>`;
}
