export function renderFreeAgentsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Free agents · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-free-agents="true">
    <header><h1>Free agents</h1></header>
    <p>Players looking for a roster. Captains can open Teams to invite someone.</p>
    <p data-status>Public list loads from the published season when bindings are healthy.</p>
    <p><a href="/teams">Teams</a> · <a href="/players">Player directory</a> · <a href="/schedule">Schedule</a></p>
  </main>
</body>
</html>`;
}
