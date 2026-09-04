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
    <p><a href="/schedule">Schedule</a> · <a href="/standings">Standings</a></p>
  </main>
</body>
</html>`;
}
