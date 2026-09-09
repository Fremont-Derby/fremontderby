export function renderPlayoffsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Fremont Derby Playoffs</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972;--gold:#d8ad3f}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111316}
    .app{width:min(980px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{display:flex;align-items:center;gap:10px;font-weight:950}
    .mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%);color:#111;font-weight:950}
    .note{color:var(--muted);line-height:1.5}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .actions a{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font-weight:800}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Playoffs</span></div>
    </header>
    <p class="note">Postseason bracket from the published schedule. Semifinals and championship show here once playoffs start. Captains use a <strong>4-player lineup with an anchor</strong> for postseason matchups.</p>
    <p class="note" data-status>Open Schedule for current rounds. Admin start/advance stays on the published season tools.</p>
    <div class="actions">
      <a href="/schedule">Schedule</a>
      <a href="/standings">Standings</a>
      <a href="/scorecard">Score</a>
      <a href="/lineup">Lineup</a>
      <a href="/trades">Trades</a>
    </div>
  </main>
</body>
</html>`;
}
