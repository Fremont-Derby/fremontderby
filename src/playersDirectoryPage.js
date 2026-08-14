import { designSystemStyles } from './designSystem.js';
import { livePageRefreshScript } from './livePageRefresh.js';

export function renderPlayersDirectoryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Player directory · Fremont Derby</title>
  <style>
    ${designSystemStyles}
    .toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:12px 0}
    .toolbar label{display:grid;gap:4px;font-size:.78rem;color:var(--muted);font-weight:850}
    .toolbar input,.toolbar select{min-height:44px;border-radius:10px;border:1px solid var(--line);background:#0d1013;color:#f5f1e9;padding:0 12px;min-width:160px}
    .list{display:grid;gap:8px}
    .row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .row strong{font-size:1rem}
    .meta{color:var(--muted);font-size:.82rem}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .actions a,button{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;text-decoration:none;font:inherit;cursor:pointer}
    .actions a.primary,button.primary{background:var(--green,#2fa972);border-color:var(--green,#2fa972);color:#06120d;font-weight:900}
    .empty{color:var(--muted);padding:16px 0}
    @media(max-width:720px){.row{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Player directory</span></div>
      <div class="status" data-status aria-live="polite">Loading…</div>
    </header>
    <p class="muted">Public roster from individual standings. Sort and search to find substitutes or teammates. Phone numbers are never shown.</p>
    <div class="toolbar">
      <label>Season
        <select data-season aria-label="Season"></select>
      </label>
      <label>Search
        <input data-search type="search" placeholder="Type at least 2 letters" autocomplete="off" maxlength="80" />
      </label>
      <label>Sort
        <select data-sort aria-label="Sort players">
          <option value="name">Name A–Z</option>
          <option value="rank">Standings rank</option>
          <option value="wins">Wins</option>
          <option value="winpct">Win %</option>
        </select>
      </label>
      <button type="button" class="primary" data-refresh>Refresh</button>
    </div>
    <div class="muted" data-meta></div>
    <section class="list" data-list></section>
    <div class="empty" data-empty hidden>No players match.</div>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const seasonEl=document.querySelector('[data-season]');
    const searchEl=document.querySelector('[data-search]');
    const sortEl=document.querySelector('[data-sort]');
    const listEl=document.querySelector('[data-list]');
    const emptyEl=document.querySelector('[data-empty]');
    const metaEl=document.querySelector('[data-meta]');
    let seasons=[];
    let rows=[];
    function setStatus(m,t,opts){if(window.fdSetStatus){window.fdSetStatus(statusEl,m,t||'muted',opts||{});return}statusEl.textContent=m;statusEl.dataset.tone=t||'muted'}
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function fetchJson(url){
      if(window.fdConditionalFetch){
        const result=await window.fdConditionalFetch(url);
        if(result.notModified && result.body) return result.body;
        if(result.response && !result.response.ok) throw new Error((result.body&&result.body.error)||'Request failed');
        return result.body||{};
      }
      const response=await fetch(url);
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'Request failed');
      return body;
    }
    function filtered(){
      const q=String(searchEl.value||'').trim().toLowerCase();
      let list=rows.slice();
      if(q.length===1){
        // require 2 chars — show none until then
        list=[];
      }else if(q.length>=2){
        list=list.filter((r)=>String(r.display_name||'').toLowerCase().includes(q));
      }
      const sort=sortEl.value;
      list.sort((a,b)=>{
        if(sort==='rank') return (Number(a.standings_rank)||999)-(Number(b.standings_rank)||999);
        if(sort==='wins') return (Number(b.wins)||0)-(Number(a.wins)||0);
        if(sort==='winpct') return (Number(b.win_percentage)||0)-(Number(a.win_percentage)||0);
        return String(a.display_name||'').localeCompare(String(b.display_name||''),undefined,{sensitivity:'base'});
      });
      return list;
    }
    function render(){
      const q=String(searchEl.value||'').trim();
      if(q.length===1){setStatus('Type at least 2 characters to search.','muted')}
      const list=filtered();
      metaEl.textContent=rows.length?(list.length+' of '+rows.length+' players'):'';
      emptyEl.hidden=list.length>0;
      emptyEl.textContent=q.length===1?'Type at least 2 characters to search.':(q?'No players match “'+q+'”.':'No players in this season yet.');
      if(window.fdStableList){
        window.fdStableList(listEl,list,{
          key:(r)=>String(r.player_id||r.display_name||''),
          signature:(r)=>[r.display_name,r.wins,r.losses,r.standings_rank,r.win_percentage].join('|'),
          render:(r)=>{
            const row=document.createElement('article');
            row.className='row';
            const left=document.createElement('div');
            const name=document.createElement('strong');
            name.textContent=r.display_name||'Player';
            const meta=document.createElement('div');
            meta.className='meta';
            const rank=r.standings_rank!=null?('Rank '+r.standings_rank):'Unranked';
            meta.textContent=rank+' · '+(r.wins||0)+'-'+(r.losses||0)+' · '+(r.win_percentage!=null?Math.round(Number(r.win_percentage)*10)/10+'%':'—');
            left.append(name,meta);
            const mid=document.createElement('div');
            mid.className='meta';
            mid.textContent=(Number(r.matches_played)||((Number(r.wins)||0)+(Number(r.losses)||0)))+' matches played';
            const actions=document.createElement('div');
            actions.className='actions';
            const standings=document.createElement('a');
            standings.href='/standings?view=individuals&season='+encodeURIComponent(seasonEl.value||'');
            standings.textContent='Standings';
            actions.append(standings);
            const pid=r.player_id||r.playerId;
            if(pid && token()){
              const msg=document.createElement('a');
              msg.className='primary';
              msg.href='/messages?player='+encodeURIComponent(pid);
              msg.textContent='Message';
              actions.append(msg);
            }
            row.append(left,mid,actions);
            return row;
          }
        });
      }else{
        listEl.replaceChildren();
        for(const r of list){
          // fallback same structure without stable helper
          const row=document.createElement('article');
          row.className='row';
          row.innerHTML='<div><strong></strong><div class="meta"></div></div><div class="meta"></div><div class="actions"></div>';
          row.querySelector('strong').textContent=r.display_name||'Player';
          listEl.append(row);
        }
      }
      if(q.length!==1) setStatus(list.length?'Directory ready':'No matches', list.length?'ok':'muted');
    }
    async function loadSeasons(){
      const body=await fetchJson('/api/seasons');
      seasons=body.seasons||[];
      seasonEl.replaceChildren();
      for(const s of seasons){
        const opt=document.createElement('option');
        opt.value=s.id;
        opt.textContent=(s.name||'Season')+' — '+(s.status||'');
        seasonEl.append(opt);
      }
      const remembered=localStorage.getItem('fd.playersSeasonId');
      if(remembered && seasons.some((s)=>s.id===remembered)) seasonEl.value=remembered;
      else if(seasons[0]) seasonEl.value=seasons[0].id;
    }
    async function loadPlayers(opts={}){
      const quiet=Boolean(opts&&opts.quiet);
      const seasonId=seasonEl.value;
      if(!seasonId){rows=[];render();setStatus('No published season yet.','muted');return}
      localStorage.setItem('fd.playersSeasonId',seasonId);
      if(!quiet) setStatus('Loading players…');
      const body=await fetchJson('/api/seasons/'+encodeURIComponent(seasonId)+'/individual-standings');
      rows=Array.isArray(body.standings)?body.standings:[];
      render();
      if(!quiet) setStatus(rows.length?(rows.length+' players loaded'):'No players yet', rows.length?'ok':'muted');
    }
    async function boot(opts){
      try{
        if(!seasons.length) await loadSeasons();
        await loadPlayers(opts);
      }catch(error){
        setStatus((window.fdFriendlyError?window.fdFriendlyError(error):(error.message||'Could not load directory')),'error');
      }
    }
    seasonEl.addEventListener('change',()=>boot());
    searchEl.addEventListener('input',()=>render());
    sortEl.addEventListener('change',()=>render());
    document.querySelector('[data-refresh]').addEventListener('click',()=>boot());
    boot();
    if(window.fdLiveRefresh) window.fdLiveRefresh.register((opts)=>boot(opts),{intervalMs:30000,immediate:false});
  </script>
</body>
</html>`;
}
