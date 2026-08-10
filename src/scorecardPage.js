export function renderScorecardPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Scorecard</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #111313;
      color: #f6f1e7;
      --panel: #1a1d1d;
      --line: #343a3a;
      --muted: #a9b2ae;
      --green: #2fa56f;
      --gold: #d7a934;
      --red: #d55448;
      --blue: #4b83d8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #111313; }
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      color: #0d1110;
      font-weight: 800;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .45; }
    .app { width: min(960px, 100%); margin: 0 auto; padding: 16px; }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 0 14px;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 900; }
    .balls { display: flex; gap: 4px; }
    .ball {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #12120f;
      background: #f7f4eb;
      font-size: .85rem;
      font-weight: 900;
    }
    .ball.nine { background: linear-gradient(#e2b737 0 34%, #f7f4eb 34% 66%, #e2b737 66%); }
    .status {
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      color: var(--muted);
      font-size: .9rem;
      text-align: right;
    }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .setup {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 800; }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0f1111;
      color: #f6f1e7;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); }
    .summary {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
      padding: 14px 0;
    }
    .player {
      min-height: 196px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .player[data-side="A"] { border-top: 4px solid var(--green); }
    .player[data-side="B"] { border-top: 4px solid var(--blue); }
    .player-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
    .name { margin: 0; font-size: 1.25rem; line-height: 1.15; }
    .meta { color: var(--muted); font-size: .9rem; }
    .score-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .score { font-size: 4rem; line-height: 1; font-weight: 950; }
    .race { color: var(--gold); font-weight: 900; }
    .rack-action { width: 100%; background: #f6f1e7; }
    .rack-action[data-side="A"] { background: var(--green); color: #06120d; }
    .rack-action[data-side="B"] { background: var(--blue); color: #07101f; }
    .match-bar {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #151818;
    }
    .stat { display: grid; gap: 4px; min-width: 0; }
    .stat span { color: var(--muted); font-size: .75rem; font-weight: 800; }
    .stat strong { overflow-wrap: anywhere; }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 14px 0;
    }
    .undo { background: transparent; color: #f6f1e7; border-color: var(--line); }
    .finalize { background: var(--red); color: #1a0604; }
    .racks {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }
    .rack-row {
      min-height: 42px;
      display: grid;
      grid-template-columns: 64px 1fr 1fr;
      gap: 8px;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid var(--line);
      background: #151818;
    }
    .rack-row:last-child { border-bottom: 0; }
    .rack-head { color: var(--muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .empty { padding: 16px; color: var(--muted); background: #151818; }
    @media (max-width: 720px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .setup, .summary, .match-bar, .actions { grid-template-columns: 1fr; }
      .score { font-size: 3.5rem; }
      .status { justify-content: flex-start; text-align: left; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <span class="balls" aria-hidden="true"><span class="ball">8</span><span class="ball nine">9</span></span>
        <span>Fremont Derby Scorecard</span>
      </div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="setup" data-form>
      <label>Match ID
        <input name="matchId" data-match-id autocomplete="off" />
      </label>
      <label>Access token
        <input name="token" data-token type="password" autocomplete="current-password" />
      </label>
      <button class="load" type="submit">Load</button>
    </form>

    <section class="summary" aria-live="polite">
      <article class="player" data-side="A">
        <div class="player-head">
          <div>
            <h2 class="name" data-player-a-name>Player A</h2>
            <div class="meta" data-player-a-rating>Rating</div>
          </div>
          <div class="race" data-player-a-race>Race to -</div>
        </div>
        <div class="score-row"><span class="score" data-score-a>0</span><span class="meta">A side</span></div>
        <button class="rack-action" data-rack-a data-side="A" type="button">A wins rack</button>
      </article>

      <article class="player" data-side="B">
        <div class="player-head">
          <div>
            <h2 class="name" data-player-b-name>Player B</h2>
            <div class="meta" data-player-b-rating>Rating</div>
          </div>
          <div class="race" data-player-b-race>Race to -</div>
        </div>
        <div class="score-row"><span class="score" data-score-b>0</span><span class="meta">B side</span></div>
        <button class="rack-action" data-rack-b data-side="B" type="button">B wins rack</button>
      </article>
    </section>

    <section class="match-bar">
      <div class="stat"><span>Discipline</span><strong data-discipline>-</strong></div>
      <div class="stat"><span>First break</span><strong data-break>-</strong></div>
      <div class="stat"><span>Status</span><strong data-match-status>-</strong></div>
      <div class="stat"><span>Winner</span><strong data-winner>-</strong></div>
    </section>

    <section class="actions">
      <button class="undo" data-undo type="button">Undo latest rack</button>
      <button class="finalize" data-finalize type="button">Finalize match</button>
    </section>

    <section class="racks" data-racks>
      <div class="empty">No rack history loaded.</div>
    </section>
  </main>

  <script>
    const form = document.querySelector('[data-form]');
    const matchInput = document.querySelector('[data-match-id]');
    const tokenInput = document.querySelector('[data-token]');
    const statusEl = document.querySelector('[data-status]');
    const rackAButton = document.querySelector('[data-rack-a]');
    const rackBButton = document.querySelector('[data-rack-b]');
    const undoButton = document.querySelector('[data-undo]');
    const finalizeButton = document.querySelector('[data-finalize]');
    const racksEl = document.querySelector('[data-racks]');
    let currentScorecard = null;

    matchInput.value = new URLSearchParams(location.search).get('match') || localStorage.getItem('fd.matchId') || '';
    tokenInput.value = sessionStorage.getItem('fd.accessToken') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function requireInputs() {
      const matchId = matchInput.value.trim();
      const token = tokenInput.value.trim();
      if (!matchId) throw new Error('Match ID is required');
      if (!token) throw new Error('Access token is required');
      localStorage.setItem('fd.matchId', matchId);
      sessionStorage.setItem('fd.accessToken', token);
      return { matchId, token };
    }

    async function api(path, options) {
      const inputs = requireInputs();
      const response = await fetch(path.replace(':id', encodeURIComponent(inputs.matchId)), {
        ...options,
        headers: {
          authorization: 'Bearer ' + inputs.token,
          'content-type': 'application/json',
        },
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    function sideLabel(side) {
      if (!currentScorecard) return side;
      return side === 'A'
        ? currentScorecard.player_a_display_name
        : currentScorecard.player_b_display_name;
    }

    function ratingText(rating, status) {
      return [rating || 'Unrated', status || 'unverified'].join(' | ');
    }

    function setText(selector, value) {
      document.querySelector(selector).textContent = value == null || value === '' ? '-' : String(value);
    }

    function renderRacks(racks) {
      racksEl.replaceChildren();
      if (!racks || racks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No racks recorded.';
        racksEl.append(empty);
        return;
      }

      const head = document.createElement('div');
      head.className = 'rack-row rack-head';
      head.innerHTML = '<span>Rack</span><span>Winner</span><span>Discipline</span>';
      racksEl.append(head);

      for (const rack of racks) {
        const row = document.createElement('div');
        row.className = 'rack-row';
        const number = document.createElement('span');
        number.textContent = rack.rackNumber || rack.rack_number;
        const winner = document.createElement('strong');
        winner.textContent = sideLabel(rack.winnerSide || rack.winner_side);
        const discipline = document.createElement('span');
        discipline.textContent = rack.discipline;
        row.append(number, winner, discipline);
        racksEl.append(row);
      }
    }

    function render(scorecard) {
      currentScorecard = scorecard;
      setText('[data-player-a-name]', scorecard.player_a_display_name);
      setText('[data-player-b-name]', scorecard.player_b_display_name);
      setText('[data-player-a-rating]', ratingText(scorecard.player_a_fargo_rating, scorecard.player_a_rating_status));
      setText('[data-player-b-rating]', ratingText(scorecard.player_b_fargo_rating, scorecard.player_b_rating_status));
      setText('[data-player-a-race]', 'Race to ' + (scorecard.race_to_a || '-'));
      setText('[data-player-b-race]', 'Race to ' + (scorecard.race_to_b || '-'));
      setText('[data-score-a]', scorecard.score_a);
      setText('[data-score-b]', scorecard.score_b);
      setText('[data-discipline]', scorecard.current_discipline);
      setText('[data-break]', scorecard.first_break);
      setText('[data-match-status]', scorecard.status);
      setText('[data-winner]', scorecard.winner_side ? sideLabel(scorecard.winner_side) : '-');
      renderRacks(scorecard.racks || []);
      rackAButton.textContent = scorecard.player_a_display_name + ' wins rack';
      rackBButton.textContent = scorecard.player_b_display_name + ' wins rack';

      const locked = scorecard.status === 'finalized' || scorecard.status === 'corrected';
      rackAButton.disabled = locked || Boolean(scorecard.winner_side);
      rackBButton.disabled = locked || Boolean(scorecard.winner_side);
      undoButton.disabled = locked || !(scorecard.racks && scorecard.racks.length);
      finalizeButton.disabled = locked || !scorecard.winner_side;
    }

    async function loadScorecard() {
      setStatus('Loading...');
      const body = await api('/api/player-matches/:id/scorecard', { method: 'GET' });
      render(body.scorecard);
      setStatus('Scorecard loaded', 'ok');
    }

    async function recordRack(winnerSide) {
      setStatus('Recording rack...');
      await api('/api/player-matches/:id/racks', {
        method: 'POST',
        body: JSON.stringify({ winnerSide }),
      });
      await loadScorecard();
    }

    async function undoRack() {
      setStatus('Undoing rack...');
      await api('/api/player-matches/:id/racks/undo', { method: 'POST', body: '{}' });
      await loadScorecard();
    }

    async function finalizeMatch() {
      setStatus('Finalizing match...');
      await api('/api/player-matches/:id/finalize', { method: 'POST', body: '{}' });
      await loadScorecard();
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
      run(loadScorecard);
    });
    rackAButton.addEventListener('click', () => run(() => recordRack('A')));
    rackBButton.addEventListener('click', () => run(() => recordRack('B')));
    undoButton.addEventListener('click', () => run(undoRack));
    finalizeButton.addEventListener('click', () => run(finalizeMatch));

    if (matchInput.value && tokenInput.value) {
      run(loadScorecard);
    }
  </script>
</body>
</html>`;
}
