export function renderTradesPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Trades</title>
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
    input, select, textarea { font-size: 16px; }
    button, a, summary, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; min-height: 100vh; background: #111316; }
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .55; }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1013;
      color: #f5f1e9;
      padding: 0 12px;
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
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
      border-radius: 8px;
      display: grid;
      place-items: center;
      color: #0d1511;
      background: var(--blue);
      font-weight: 950;
    }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .setup {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    .span-2 { grid-column: span 2; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
    .primary { background: var(--green); color: #06120d; }
    .secondary { background: var(--gold); color: #12100a; }
    .ghost { background: transparent; color: #f5f1e9; border-color: var(--line); }
    .danger { background: var(--red); color: #1a0604; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
      margin-top: 14px;
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
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      background: #26303a;
      color: #d8e4ea;
      font-size: .78rem;
      font-weight: 900;
    }
    .action-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .action-row button { min-height: 36px; padding: 0 10px; }
    .empty { padding: 16px; color: var(--muted); }
    @media (max-width: 900px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .setup { grid-template-columns: 1fr; }
      .span-2 { grid-column: auto; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 840px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">T</span><span>Fremont Derby Trades</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="setup" data-trade-form>
      <label class="span-2">Access token
        <input name="token" data-token type="password" autocomplete="current-password" />
      </label>
      <label>My team ID
        <input name="teamId" data-team-id autocomplete="off" />
      </label>
      <label>My player ID
        <input name="offeredPlayerId" data-offered-player-id autocomplete="off" />
      </label>
      <label>Other team ID
        <input name="requestedTeamId" data-requested-team-id autocomplete="off" />
      </label>
      <label>Other player ID
        <input name="requestedPlayerId" data-requested-player-id autocomplete="off" />
      </label>
      <div class="actions span-2">
        <button class="primary" type="submit">Propose trade</button>
        <button class="ghost" data-refresh type="button">Refresh</button>
      </div>
    </form>

    <section class="panel">
      <div class="panel-head"><span>My trades</span><span class="badge" data-trade-count>0</span></div>
      <table>
        <thead>
          <tr><th>Status</th><th>Season</th><th>Trade</th><th>Player acceptance</th><th>Captain approval</th><th>Actions</th></tr>
        </thead>
        <tbody data-trades-body></tbody>
      </table>
      <div class="empty" data-trades-empty>No trades loaded.</div>
    </section>
  </main>

  <script>
    const form = document.querySelector('[data-trade-form]');
    const statusEl = document.querySelector('[data-status]');
    const tokenInput = document.querySelector('[data-token]');
    const teamIdInput = document.querySelector('[data-team-id]');
    const offeredPlayerInput = document.querySelector('[data-offered-player-id]');
    const requestedTeamInput = document.querySelector('[data-requested-team-id]');
    const requestedPlayerInput = document.querySelector('[data-requested-player-id]');
    const tradesBody = document.querySelector('[data-trades-body]');
    const tradesEmpty = document.querySelector('[data-trades-empty]');
    const tradeCount = document.querySelector('[data-trade-count]');

    const params = new URLSearchParams(location.search);
    tokenInput.value = sessionStorage.getItem('fd.accessToken') || '';
    teamIdInput.value = params.get('team') || localStorage.getItem('fd.tradesTeamId') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function token() {
      const value = tokenInput.value.trim();
      if (!value) throw new Error('Access token is required');
      sessionStorage.setItem('fd.accessToken', value);
      return value;
    }

    async function parseJson(response) {
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return { error: text };
      }
    }

    async function api(path, options) {
      const response = await fetch(path, {
        ...options,
        headers: {
          authorization: 'Bearer ' + token(),
          'content-type': 'application/json',
        },
      });
      const body = await parseJson(response);
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    function cell(value) {
      const td = document.createElement('td');
      td.textContent = value == null || value === '' ? '-' : String(value);
      return td;
    }

    function actionButton(label, className, dataset) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      for (const [key, value] of Object.entries(dataset)) {
        button.dataset[key] = value;
      }
      return button;
    }

    function statusText(value) {
      return value ? 'yes' : 'pending';
    }

    function actionsCell(trade) {
      const td = document.createElement('td');
      if (trade.status !== 'pending') {
        td.textContent = '-';
        return td;
      }

      const wrap = document.createElement('div');
      wrap.className = 'action-row';
      wrap.append(
        actionButton('Accept', 'primary', { playerResponse: trade.tradeId, response: 'accepted' }),
        actionButton('Decline', 'danger', { playerResponse: trade.tradeId, response: 'declined' }),
        actionButton('Approve', 'secondary', { captainApproval: trade.tradeId, response: 'approved' }),
        actionButton('Reject', 'danger', { captainApproval: trade.tradeId, response: 'declined' }),
      );
      td.append(wrap);
      return td;
    }

    function renderTrades(trades) {
      tradesBody.replaceChildren();
      tradesEmpty.hidden = trades.length > 0;
      tradeCount.textContent = String(trades.length);
      for (const trade of trades) {
        const tr = document.createElement('tr');
        const tradeText = (trade.offeredPlayerName || trade.offeredPlayerId)
          + ' from ' + (trade.requestingTeamName || trade.requestingTeamId)
          + ' for ' + (trade.requestedPlayerName || trade.requestedPlayerId)
          + ' from ' + (trade.requestedTeamName || trade.requestedTeamId);
        tr.append(
          cell(trade.status),
          cell(trade.seasonName || trade.seasonId),
          cell(tradeText),
          cell(statusText(trade.requestingPlayerAcceptedAt) + ' / ' + statusText(trade.requestedPlayerAcceptedAt)),
          cell(statusText(trade.requestingCaptainApprovedAt) + ' / ' + statusText(trade.requestedCaptainApprovedAt)),
          actionsCell(trade),
        );
        tradesBody.append(tr);
      }
    }

    async function loadTrades() {
      setStatus('Loading...');
      const body = await api('/api/me/trades', { method: 'GET' });
      renderTrades((body.tradeManagement && body.tradeManagement.trades) || []);
      setStatus('Trades loaded', 'ok');
    }

    async function proposeTrade() {
      const teamId = teamIdInput.value.trim();
      const offeredPlayerId = offeredPlayerInput.value.trim();
      const requestedTeamId = requestedTeamInput.value.trim();
      const requestedPlayerId = requestedPlayerInput.value.trim();
      if (!teamId) throw new Error('Team ID is required');
      if (!offeredPlayerId) throw new Error('My player ID is required');
      if (!requestedTeamId) throw new Error('Other team ID is required');
      if (!requestedPlayerId) throw new Error('Other player ID is required');
      localStorage.setItem('fd.tradesTeamId', teamId);
      setStatus('Proposing trade...');
      await api('/api/teams/' + encodeURIComponent(teamId) + '/trades', {
        method: 'POST',
        body: JSON.stringify({ offeredPlayerId, requestedTeamId, requestedPlayerId }),
      });
      await loadTrades();
    }

    async function playerResponse(tradeId, response) {
      setStatus(response === 'accepted' ? 'Accepting trade...' : 'Declining trade...');
      await api('/api/team-trades/' + encodeURIComponent(tradeId) + '/player-response', {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      await loadTrades();
    }

    async function captainApproval(tradeId, response) {
      setStatus(response === 'approved' ? 'Approving trade...' : 'Rejecting trade...');
      await api('/api/team-trades/' + encodeURIComponent(tradeId) + '/captain-approval', {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      await loadTrades();
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
      run(proposeTrade);
    });
    document.querySelector('[data-refresh]').addEventListener('click', () => run(loadTrades));
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.playerResponse) {
        run(() => playerResponse(button.dataset.playerResponse, button.dataset.response));
      }
      if (button.dataset.captainApproval) {
        run(() => captainApproval(button.dataset.captainApproval, button.dataset.response));
      }
    });

    renderTrades([]);
    if (tokenInput.value) {
      run(loadTrades);
    }
  </script>
</body>
</html>`;
}
