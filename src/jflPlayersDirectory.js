import { decorateHtmlWithShell } from './appShell.js';

export function publicDirectoryRows(individuals = [], teams = []) {
  const teamByPlayer = new Map();
  for (const team of Array.isArray(teams) ? teams : []) {
    for (const member of Array.isArray(team?.roster) ? team.roster : []) {
      if (member?.playerId) teamByPlayer.set(member.playerId, String(team.team_name || 'Team'));
    }
  }
  return (Array.isArray(individuals) ? individuals : []).map((row) => ({
    name: String(row?.display_name || 'Player'),
    team: teamByPlayer.get(row?.player_id) || 'Free agent / no team listed',
    rank: Number.isFinite(Number(row?.standings_rank)) && row?.standings_rank !== null
      ? Number(row.standings_rank) : null,
    wins: Number(row?.wins) || 0,
    losses: Number(row?.losses) || 0,
    matches: Number(row?.matches_played) || 0,
  }));
}

const styles = `<style>
  .fd-players{width:min(100% - 32px,960px);margin:0 auto;padding:28px 0 110px;color:#14231a}
  .fd-players h1{margin:0 0 8px;font-size:clamp(2rem,6vw,3.2rem)}
  .fd-players p{line-height:1.5;color:#415348}.fd-players__filters{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0;padding:16px;border:1px solid #b6c9bc;border-radius:14px;background:#fff}
  .fd-players label{display:grid;gap:6px;font-weight:800}.fd-players select,.fd-players input{width:100%;min-height:46px;padding:8px 10px;border:1px solid #718d77;border-radius:8px;background:#fff;color:#14231a;font:inherit}
  .fd-players__status{min-height:26px}.fd-players__status[data-tone=error]{color:#9a241b}
  .fd-players__list{display:grid;gap:9px;list-style:none;padding:0;margin:12px 0}.fd-players__row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px;border:1px solid #b6c9bc;border-radius:12px;background:#fff}
  .fd-players__row strong{font-size:1.05rem;overflow-wrap:anywhere}.fd-players__team{display:block;color:#415348;font-size:.9rem;margin-top:3px}.fd-players__record{font-weight:800}.fd-players__row a,.fd-players__empty a{color:#145c35;font-weight:800;min-height:44px;display:inline-flex;align-items:center}
  .fd-players__empty{padding:20px;border:1px dashed #718d77;border-radius:12px;background:#fff}.fd-players [hidden]{display:none!important}
  .fd-players :is(a,input,select):focus-visible{outline:3px solid #1f7a52;outline-offset:3px}
  @media(max-width:700px){.fd-players__filters{grid-template-columns:1fr}.fd-players__row{grid-template-columns:1fr;gap:7px}}
</style>`;

const script = `<script>
(() => {
  const project = (${publicDirectoryRows.toString()});
  const root=document.querySelector('[data-players-directory]');
  const season=root.querySelector('[data-season]');
  const search=root.querySelector('[data-search]');
  const sort=root.querySelector('[data-sort]');
  const list=root.querySelector('[data-list]');
  const empty=root.querySelector('[data-empty]');
  const status=root.querySelector('[data-status]');
  let rows=[];
  let loadNumber=0;
  function state(message,tone='muted'){status.textContent=message;status.dataset.tone=tone}
  async function getJson(path){const response=await fetch(path);if(!response.ok)throw new Error('Directory data is unavailable. Try again.');return response.json()}
  function render(){
    const term=search.value.trim().toLocaleLowerCase();
    const shown=rows.filter(row=>!term||row.name.toLocaleLowerCase().includes(term)||row.team.toLocaleLowerCase().includes(term));
    shown.sort((a,b)=>sort.value==='wins'?b.wins-a.wins||a.name.localeCompare(b.name):sort.value==='rank'?(a.rank??9999)-(b.rank??9999)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
    list.replaceChildren();
    for(const row of shown){
      const li=document.createElement('li');li.className='fd-players__row';
      const identity=document.createElement('div');const name=document.createElement('strong');name.textContent=row.name;const team=document.createElement('span');team.className='fd-players__team';team.textContent=row.team;identity.append(name,team);
      const record=document.createElement('span');record.className='fd-players__record';record.textContent=(row.rank===null?'Unranked':'Rank '+row.rank)+' · '+row.wins+'-'+row.losses+' · '+row.matches+' played';
      const link=document.createElement('a');link.href='/standings?view=individuals&season='+encodeURIComponent(season.value);link.textContent='View results';
      li.append(identity,record,link);list.append(li);
    }
    empty.hidden=shown.length>0;
    empty.querySelector('[data-empty-text]').textContent=term?'No players match that search.':'No players are listed for this season yet.';
    if(rows.length)state(shown.length+' of '+rows.length+' players','ok');
  }
  async function load(){
    const id=season.value;const request=++loadNumber;
    if(!id){rows=[];render();state('No published season is available.');return}
    state('Loading players…');
    try{
      const encoded=encodeURIComponent(id);
      const [individuals,teams]=await Promise.all([getJson('/api/seasons/'+encoded+'/individual-standings'),getJson('/api/seasons/'+encoded+'/team-standings')]);
      if(request!==loadNumber)return;
      rows=project(individuals.standings,teams.standings);
      try{localStorage.setItem('fd.playersSeasonId',id)}catch{}
      render();
    }catch{if(request!==loadNumber)return;rows=[];render();state('Directory data is unavailable. Try again.','error')}
  }
  async function boot(){
    state('Loading seasons…');
    try{
      const body=await getJson('/api/seasons');const seasons=Array.isArray(body.seasons)?body.seasons:[];
      season.replaceChildren();
      for(const item of seasons){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' — '+item.status;season.append(option)}
      let remembered='';try{remembered=localStorage.getItem('fd.playersSeasonId')||''}catch{}
      if(remembered&&seasons.some(item=>item.id===remembered))season.value=remembered;
      await load();
    }catch{state('Directory data is unavailable. Try again.','error')}
  }
  season.addEventListener('change',load);search.addEventListener('input',render);sort.addEventListener('change',render);
  root.querySelector('[data-retry]').addEventListener('click',boot);
  boot();
})();
</script>`;

export function renderJflPlayersDirectory() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Players · Fremont Derby</title>${styles}</head><body>
  <main class="fd-players" data-players-directory><h1>Players</h1><p>Find people in the league by name or team. Results and records come from official individual standings; private contact and payment details are never shown.</p>
    <div class="fd-players__filters"><label>Season<select data-season aria-label="Season"></select></label><label>Find player or team<input data-search type="search" autocomplete="off" placeholder="Search names or teams"></label><label>Sort<select data-sort><option value="name">Name A–Z</option><option value="rank">Standings rank</option><option value="wins">Wins</option></select></label></div>
    <p class="fd-players__status" data-status role="status" aria-live="polite">Loading seasons…</p><button type="button" data-retry>Retry</button>
    <ul class="fd-players__list" data-list aria-label="Player directory"></ul><div class="fd-players__empty" data-empty hidden><span data-empty-text></span> <a href="/teams">Browse teams</a></div>
  </main>${script}</body></html>`;
  return decorateHtmlWithShell(html, '/players');
}

export function routeJflPlayersDirectory(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || new URL(request.url).pathname !== '/players') return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return new Response(renderJflPlayersDirectory(), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
