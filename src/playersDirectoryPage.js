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
    <p>Public names from the active season. Contact numbers, payments, and internal IDs are never shown.</p>
    <label>Search <input data-search type="search" placeholder="Type at least 2 letters" maxlength="80" /></label>
    <p data-status>Loading players…</p>
    <p data-empty hidden></p>
    <ul data-list hidden></ul>
    <p><a href="/teams">Teams</a> · <a href="/standings">Standings</a> · <a href="/schedule">Schedule</a></p>
  </main>
  <script>
    const statusEl = document.querySelector('[data-status]');
    const emptyEl = document.querySelector('[data-empty]');
    const listEl = document.querySelector('[data-list]');
    const searchEl = document.querySelector('[data-search]');
    let rows = [];
    function paint() {
      const query = (searchEl.value || '').trim().toLowerCase();
      const visible = query.length < 2 ? rows : rows.filter((row) => (row.display_name || '').toLowerCase().includes(query));
      listEl.replaceChildren();
      for (const row of visible) {
        const item = document.createElement('li');
        item.textContent = row.display_name || 'Unnamed player';
        listEl.append(item);
      }
      listEl.hidden = visible.length === 0;
      emptyEl.hidden = visible.length > 0;
      emptyEl.textContent = rows.length ? 'No published names match that search.' : 'No published player names yet.';
      statusEl.textContent = rows.length ? rows.length + ' published player' + (rows.length === 1 ? '' : 's') : 'No published players';
    }
    async function load() {
      const seasonResponse = await fetch('/api/seasons');
      const seasonBody = await seasonResponse.json();
      if (!seasonResponse.ok) throw new Error(seasonBody.error || 'Seasons could not be loaded.');
      const seasons = seasonBody.seasons || [];
      const season = seasons.find((item) => item.status === 'active') || seasons[0];
      if (!season) {
        rows = [];
        paint();
        statusEl.textContent = 'No season is published yet.';
        return;
      }
      const standingsResponse = await fetch('/api/seasons/' + encodeURIComponent(season.id) + '/individual-standings');
      const standingsBody = await standingsResponse.json();
      if (!standingsResponse.ok) throw new Error(standingsBody.error || 'Player directory could not be loaded.');
      rows = (standingsBody.standings || []).filter((row) => row.display_name);
      paint();
    }
    searchEl.addEventListener('input', paint);
    load().catch((error) => {
      statusEl.textContent = error.message;
      emptyEl.hidden = true;
      listEl.hidden = true;
    });
  </script>
</body>
</html>`;
}
