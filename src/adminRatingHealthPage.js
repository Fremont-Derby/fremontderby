/** #174 Rating freshness / observation health (admin). */
export function renderAdminRatingHealthPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rating health · Admin · Fremont Derby</title>
  <style>
    body{margin:0;font-family:system-ui,sans-serif;background:#12151a;color:#e8eef4}
    main{max-width:800px;margin:0 auto;padding:16px;display:grid;gap:12px}
    a{color:#9ee5bd}.muted{color:#aab3bb;font-size:.9rem;line-height:1.45}
    .panel{background:#191d22;border:1px solid #343c45;border-radius:12px;padding:12px}
    table{width:100%;border-collapse:collapse;font-size:.9rem}
    th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #343c45}
    button{min-height:44px}
  </style>
</head>
<body>
<main>
  <p class="muted"><a href="/admin">Admin</a> · Rating health</p>
  <h1>Rating health</h1>
  <p class="muted">Observation freshness and source mix. Official Fargo is never a local calculation.</p>
  <section class="panel">
    <div id="summary" class="muted">Sign in as league admin to load…</div>
    <div style="overflow:auto"><table>
      <thead><tr><th>Player</th><th>Seed</th><th>Source</th><th>Confidence</th><th>Updated</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
  </section>
</main>
<script>
(() => {
  const token = () => sessionStorage.getItem('fd.accessToken') || localStorage.getItem('fd.accessToken') || '';
  async function load() {
    const summary = document.getElementById('summary');
    const rows = document.getElementById('rows');
    if (!token()) { summary.textContent = 'Sign in from Profile as a league admin.'; return; }
    try {
      const res = await fetch('/api/admin/players', { headers: { authorization: 'Bearer ' + token() } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load');
      const players = body.players || [];
      let withRating = 0, official = 0, estimate = 0, provisional = 0, missing = 0;
      rows.replaceChildren();
      for (const p of players) {
        const rating = p.fargoRating ?? p.fargo_rating;
        const source = String(p.ratingSource || p.rating_source || p.ratingStatus || p.rating_status || '');
        if (rating == null) missing += 1;
        else {
          withRating += 1;
          if (/official|established/i.test(source)) official += 1;
          else if (/derby_estimate/i.test(source)) estimate += 1;
          else provisional += 1;
        }
        const tr = document.createElement('tr');
        tr.innerHTML = '<td></td><td></td><td></td><td></td><td class="muted"></td>';
        tr.cells[0].textContent = p.displayName || p.display_name || '—';
        tr.cells[1].textContent = rating != null ? String(rating) : '—';
        tr.cells[2].textContent = source || '—';
        tr.cells[3].textContent = p.confidence || '—';
        tr.cells[4].textContent = p.ratingUpdatedAt || p.updated_at || '';
        rows.append(tr);
      }
      summary.textContent = players.length + ' players · ' + withRating + ' seeded · official ' + official + ' · estimates ' + estimate + ' · provisional ' + provisional + ' · missing ' + missing;
    } catch (e) {
      summary.textContent = e.message || 'Load failed';
    }
  }
  load();
})();
</script>
</body>
</html>`;
}
