import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

export function renderPlayoffsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Fremont Derby Playoffs</title>
</head>
<body>
  <main class="app" data-fd-dru-playoffs="true">
    <header><h1>Playoffs</h1></header>
    <p>Postseason bracket from the published schedule. Semifinals and championship appear here once playoffs start.</p>
    <p data-playoff-empty>No bracket rows yet. Seeds come from Standings after the regular season closes.</p>
    <p data-next-match>Looking up your next published match…</p>
    <p><a href="/standings">Standings</a> · <a href="/schedule">Schedule</a></p>
  </main>
  <script>
    ${nextMatchSummaryBrowserSource}
    const nextEl = document.querySelector('[data-next-match]');
    fetch('/api/me/matches', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((body) => {
        const next = pickNextMatch(body.matches || []);
        nextEl.textContent = next
          ? ('Next match: ' + nextMatchLabel(next))
          : 'No upcoming match published.';
      })
      .catch(() => {
        nextEl.textContent = 'Could not load matches.';
      });
  </script>
</body>
</html>`;
}
