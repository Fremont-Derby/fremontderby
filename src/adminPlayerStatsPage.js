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
    <p class="note" data-expiry-split>Registration expiry is maintained apart from the public read pages.</p>
<p class="muted"><a href="/admin">Admin</a> · <a href="/admin/players">Players</a></p>
<h1>Player season stats</h1>
<p class="muted">Derived from finalized matches. Locked match ratings are historical.</p>
<section class="panel">
<label class="muted">Player id<input id="pid" placeholder="From Admin → Players"/></label>
<button type="button" id="go">Load summary</button>
<pre id="out" class="muted" style="white-space:pre-wrap">Enter the player id, then load the summary.</pre>
</section>
<script>
const input = document.getElementById('pid');
const out = document.getElementById('out');
document.getElementById('go').onclick = async () => {
  const id = input.value.trim();
  if (!id) { out.textContent = 'Enter a player id.'; return; }
  out.textContent = 'Loading summary…';
  const token = sessionStorage.getItem('fd.accessToken') || '';
  const response = await fetch('/api/admin/player-stats?playerId=' + encodeURIComponent(id), { headers: token ? { authorization: 'Bearer ' + token } : {} });
  const body = await response.json().catch(() => ({}));
  out.textContent = response.ok
    ? (id + ': ' + (body.wins || 0) + ' wins, ' + (body.losses || 0) + ' losses, ' + (body.matchesPlayed || 0) + ' matches.')
    : (body.error || 'Player summary could not be loaded.');
};
</script>
</main></body></html>`;
}
