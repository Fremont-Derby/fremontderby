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
    <p data-next-match>Your next published match is on Schedule. Tonight's opponent and table time show there first.</p>
    <p><a href="/schedule">Schedule</a> · <a href="/messages">Messages</a> · <a href="/profile">Profile</a> · <a href="/teams">Teams</a></p>
  </main>
</body>
</html>`;
}
