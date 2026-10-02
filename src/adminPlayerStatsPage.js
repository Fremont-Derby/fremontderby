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
<pre id="out" class="muted" style="white-space:pre-wrap">Pick a player id from Admin, Players, then load the summary.</pre>
</section>
<script>
const select = document.getElementById('pid');
select.outerHTML = '<select id="pid"><option value="">Loading players…</option></select>';
const picker = document.getElementById('pid');
const out = document.getElementById('out');
const token = sessionStorage.getItem('fd.accessToken') || '';
fetch('/api/admin/players', { headers: token ? { authorization: 'Bearer ' + token } : {} })
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((body) => {
    const players = body.players || body || [];
    picker.innerHTML = '<option value="">Choose a player</option>' + players.map((player) => '<option value="' + (player.playerId || player.id) + '">' + (player.displayName || player.display_name || 'Player') + '</option>').join('');
  })
  .catch(() => { picker.innerHTML = '<option value="">Sign in on Profile, then open Admin, Players.</option>'; });
document.getElementById('go').onclick = () => {
  const name = picker.options[picker.selectedIndex] ? picker.options[picker.selectedIndex].text : '';
  out.textContent = picker.value ? (name + ' is selected. Season record comes from finalized matches.') : 'Choose a player.';
};
</script>
</main></body></html>`;
}
