import { routeQaScorecard as routeBaseQaScorecard } from './qaScorecardHttp.js';

export function scoreSubmittedRackHistory(racks = []) {
  let a = 0;
  let b = 0;
  for (const rack of racks) {
    const winner = rack?.winnerSide || rack?.winner_side;
    if (winner === 'A') a += 1;
    if (winner === 'B') b += 1;
  }
  return { a, b };
}

const scoreSubmittedRackHistorySource = scoreSubmittedRackHistory.toString();

const qaOwnScoreScript = `<script>
(() => {
  ${scoreSubmittedRackHistorySource}

  function scoringRowIndex(rows, state) {
    if (state.ownSide === 'A') return 0;
    if (state.ownSide === 'B') return 1;
    const editableIndex = rows.findIndex((row) => row.querySelector('.rack-edit'));
    return editableIndex >= 0 ? editableIndex : null;
  }

  function syncQaOwnScore() {
    const state = window.fdRackLedgerState || {};
    const rows = Array.from(document.querySelectorAll('[data-ledger] tbody tr')).slice(0, 2);
    const rowIndex = scoringRowIndex(rows, state);
    if (rowIndex == null || !rows[rowIndex]) return;

    const ownRacks = [];
    for (const cell of rows[rowIndex].querySelectorAll('.submission')) {
      const value = cell.dataset.value;
      if (value !== 'W' && value !== 'L') continue;
      const ownSide = state.ownSide === 'B' ? 'B' : 'A';
      ownRacks.push({ winnerSide: value === 'W' ? ownSide : (ownSide === 'A' ? 'B' : 'A') });
    }

    const score = scoreSubmittedRackHistory(ownRacks);
    const scoreA = document.querySelector('[data-score-a]');
    const scoreB = document.querySelector('[data-score-b]');
    if (scoreA) scoreA.textContent = String(score.a);
    if (scoreB) scoreB.textContent = String(score.b);

    const label = document.querySelector('.race-context > span:first-child');
    if (label) label.textContent = 'Live individual score';
  }

  requestAnimationFrame(syncQaOwnScore);
  const ledger = document.querySelector('[data-ledger]');
  if (ledger) {
    new MutationObserver(syncQaOwnScore).observe(ledger, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-value', 'class']
    });
  }
})();
</script>`;

export async function routeQaScorecard(request, env = {}) {
  const response = routeBaseQaScorecard(request, env);
  if (!response) return null;

  const url = new URL(request.url);
  if (url.pathname !== '/qa/scorecard/play' || response.status !== 200) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const enhanced = html.replace('</body>', `${qaOwnScoreScript}</body>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(enhanced, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
