import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

export function renderPracticePage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Practice · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-practice="true">
    <header><h1>Practice</h1></header>
    <p>Published league nights are the default table window. Teams may practice or play a makeup before the posted date.</p>
    <p data-next-match>Looking up your next published night…</p>
    <p><a href="/schedule">Schedule</a> · <a href="/availability">Check in</a> · <a href="/messages">Messages</a></p>
  </main>
  <script>
    ${nextMatchSummaryBrowserSource}
    const nextEl = document.querySelector('[data-next-match]');
    const teamId = new URLSearchParams(location.search).get('team') || '';
    fetch('/api/me/matches', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((body) => {
        const next = pickNextMatch(body.matches || [], { teamId });
        nextEl.textContent = next
          ? ('Next published night: ' + nextMatchLabel(next) + '. Practice or makeup before that date.')
          : 'No upcoming match published. Use Schedule if a captain posts a makeup.';
      })
      .catch(() => {
        nextEl.textContent = 'Could not load matches. Open Schedule for the published night.';
      });
  </script>
</body>
</html>`;
}
