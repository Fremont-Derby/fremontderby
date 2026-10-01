import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

export function renderNotificationsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Notifications · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-notifications="true">
    <header><h1>Notifications</h1></header>
    <p>League alerts and unread message counts. Open Messages for the conversation itself.</p>
    <p data-next-match>Looking up your next published match…</p>
    <p><a href="/schedule">Schedule</a> · <a href="/messages">Messages</a> · <a href="/profile">Profile</a> · <a href="/teams">Teams</a></p>
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
          ? ('Next match: ' + nextMatchLabel(next) + '. Open Schedule for table time.')
          : 'No upcoming match published. Open Schedule if a captain posts a makeup.';
      })
      .catch(() => {
        nextEl.textContent = 'Could not load matches. Open Schedule for the published night.';
      });
  </script>
</body>
</html>`;
}
