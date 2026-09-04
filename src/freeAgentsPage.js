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
    <p>Players looking for a roster. Captains invite from Teams. Published names stay on Player directory.</p>
    <p data-status>No open roster list is published yet. Open Teams to ask a captain, or browse Player directory.</p>
    <p><a href="/teams">Teams</a> · <a href="/players">Player directory</a> · <a href="/schedule">Schedule</a></p>
  </main>
</body>
</html>`;
}
