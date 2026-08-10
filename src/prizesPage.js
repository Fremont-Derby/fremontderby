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
      --line: #343c45;
      --muted: #aab3bb;
      --green: #2fa972;
      --gold: #d8ad3f;
      --blue: #4e83d6;
      --red: #d45b50;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #111316; }
    button, input { font: inherit; }
    button {
      min-height: 42px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 850;
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
    input {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1013;
      color: #f5f1e9;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); color: #12100a; }
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
      color: #bcd5ff;
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
      .topbar { align-items: flex-start; }
      .controls, .summary, .grid { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 520px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">$</span><span>Fremont Derby Prizes</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="controls" data-form>
      <label>Season ID
        <input name="seasonId" data-season-id autocomplete="off" />
      </label>
      <button class="load" type="submit">Load</button>
    </form>

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
    const statusEl = document.querySelector('[data-status]');
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

    seasonInput.value = new URLSearchParams(location.search).get('season') || localStorage.getItem('fd.prizesSeasonId') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
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
    }

    async function loadPrizes() {
      const seasonId = seasonInput.value.trim();
      if (!seasonId) throw new Error('Season ID is required');
      localStorage.setItem('fd.prizesSeasonId', seasonId);
      setStatus('Loading...');
      const response = await fetch('/api/seasons/' + encodeURIComponent(seasonId) + '/prizes');
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Prize summary failed');
      }
      renderSummary(body.summary || {});
      setStatus('Prizes loaded', 'ok');
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run(loadPrizes);
    });

    if (seasonInput.value) {
      run(loadPrizes);
    }
  </script>
</body>
</html>`;
}
