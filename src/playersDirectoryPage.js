export function renderPlayersDirectoryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Player directory · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-players="true">
    <header><h1>Player directory</h1></header>
    <p>Public names and team context only. Contact numbers, payments, and internal IDs are never shown.</p>
    <label>Search <input data-search type="search" placeholder="Type at least 2 letters" maxlength="80" /></label>
    <p data-empty>Directory loads after the DRU season bootstrap is healthy.</p>
    <p><a href="/teams">Teams</a> · <a href="/standings">Standings</a> · <a href="/schedule">Schedule</a></p>
  </main>
</body>
</html>`;
}
