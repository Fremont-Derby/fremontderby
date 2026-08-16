/** #72 Admin player season stats shell */
export function renderAdminPlayerStatsPage() {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Player season stats · Admin</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#12151a;color:#e8eef4}
main{max-width:720px;margin:0 auto;padding:16px;display:grid;gap:12px}
.muted{color:#aab3bb}.panel{background:#191d22;border:1px solid #343c45;border-radius:12px;padding:12px}
a{color:#9ee5bd} input,button{min-height:44px}</style>
</head><body><main>
<p class="muted"><a href="/admin">Admin</a> · <a href="/admin/players">Players</a></p>
<h1>Player season stats</h1>
<p class="muted">Derived from finalized matches. Locked match ratings are historical.</p>
<section class="panel">
<label class="muted">Player id<input id="pid" placeholder="From Admin → Players"/></label>
<button type="button" id="go">Load summary</button>
<pre id="out" class="muted" style="white-space:pre-wrap">Stats helper: src/playerSeasonStats.js. Wire match feed RPC when ready.</pre>
</section>
<script>
document.getElementById('go').onclick = () => {
  const id = document.getElementById('pid').value.trim();
  document.getElementById('out').textContent = id
    ? ('Player ' + id + ': use Audit for privileged timeline; scorecard for finalized racks.')
    : 'Player id required';
};
</script>
</main></body></html>`;
}
