import { livePageRefreshScript } from './livePageRefresh.js';
import { safeAutocompleteClientScript } from './safeAutocomplete.js';

export function renderTradesPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Fremont Derby Trades</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972;--gold:#d8ad3f;--red:#d45b50}
    *{box-sizing:border-box}button,a,select,input{touch-action:manipulation;font:inherit}
    body{margin:0;min-height:100vh;background:#111316}
    .app{width:min(1120px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{display:flex;gap:10px;align-items:center;font-weight:950}
    .mark{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--green);color:#0d1511;font-weight:950}
    .status{color:var(--muted);text-align:right;min-height:28px}
    .status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}
    .panel{margin-top:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    label{display:grid;gap:6px;color:var(--muted);font-size:.78rem;font-weight:850}
    select,input,button{min-height:44px;border-radius:8px;border:1px solid var(--line);background:#0d1013;color:#f5f1e9;padding:0 12px}
    button.primary{background:var(--green);border-color:var(--green);color:#06120d;font-weight:950;cursor:pointer}
    button.ghost{background:transparent;cursor:pointer}
    table{width:100%;border-collapse:collapse}th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;font-size:.86rem}
    .empty{padding:16px;color:var(--muted)}
    .note{color:var(--muted);line-height:1.5}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    @media(max-width:720px){.grid{grid-template-columns:1fr}.status{text-align:left}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Trades</span></div>
      <div class="status" data-status>Loading…</div>
    </header>
    <p class="note">Captains propose swaps. Both players and both captains must accept before the roster move completes. Sign in on Profile first.</p>
    <section class="panel">
      <h2>Propose a trade</h2>
      <form class="grid" data-trade-form>
        <label>My team<select data-team-id required></select></label>
        <label>My player ID<input data-offered-player-id required placeholder="Player UUID on your roster" autocomplete="off" /></label>
        <label>Other team ID<input data-requested-team-id required placeholder="Team UUID" autocomplete="off" /></label>
        <label>Other player ID<input data-requested-player-id required placeholder="Player UUID on other team" autocomplete="off" /></label>
        <div class="actions" style="grid-column:1/-1">
          <button class="primary" type="submit">Propose trade</button>
          <button class="ghost" type="button" data-refresh>Refresh</button>
          <a class="ghost" href="/teams" style="display:inline-flex;align-items:center;color:#9ee5bd">Open Teams</a>
        </div>
      </form>
    </section>
    <section class="panel">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <h2 style="margin:0">My trades</h2>
        <span data-trade-count>0</span>
      </div>
      <div data-trades-list></div>
      <div class="empty" data-trades-empty>No trades yet.</div>
    </section>
  </main>
  ${livePageRefreshScript}
  ${safeAutocompleteClientScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const teamSelect=document.querySelector('[data-team-id]');
    const offeredPlayerInput=document.querySelector('[data-offered-player-id]');
    const requestedTeamInput=document.querySelector('[data-requested-team-id]');
    
    
    const listEl=document.querySelector('[data-trades-list]');
    const emptyEl=document.querySelector('[data-trades-empty]');
    const countEl=document.querySelector('[data-trade-count]');
    let captainTeams=[];
    function setStatus(m,t){statusEl.textContent=m;statusEl.dataset.tone=t||'muted'}
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function api(path,options={}){
      if(!token())throw new Error('Sign in on Profile first.');
      const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json',...(options.headers||{})}});
      const body=await response.json().catch(()=>({}));
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');throw new Error('Sign in on Profile first.');}
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    function fillSelect(select,rows,map){
      select.replaceChildren();
      const placeholder=document.createElement('option');
      placeholder.value='';
      placeholder.textContent='Select…';
      select.append(placeholder);
      for(const row of rows){
        const opt=document.createElement('option');
        const mapped=map(row);
        opt.value=mapped.value;
        opt.textContent=mapped.label;
        select.append(opt);
      }
    }
    async function loadTeams(){
      const body=await api('/api/me/teams');
      const management=body.teamManagement||{};
      const list=management.captain_teams||management.captainTeams||[];
      captainTeams=list;
      fillSelect(teamSelect,list,(t)=>({
        value:t.teamId||t.team_id||t.id,
        label:(t.teamName||t.team_name||t.name||'Team')+(t.seasonName?(' · '+t.seasonName):'')
      }));
      if(list[0])teamSelect.value=list[0].teamId||list[0].team_id||list[0].id||'';
      // Player IDs still required by trade RPC; keep text fields for offered/requested players.
      

    }
    async function loadRosterOptions(){ /* reserved for future roster select enrichment */ }
    function renderTrades(trades){
      listEl.replaceChildren();
      countEl.textContent=String(trades.length);
      emptyEl.hidden=trades.length>0;
      for(const trade of trades){
        const card=document.createElement('article');
        card.style.borderBottom='1px solid var(--line)';
        card.style.padding='10px 0';
        const title=document.createElement('strong');
        title.textContent=String(trade.status||'pending');
        const detail=document.createElement('div');
        detail.className='note';
        detail.textContent=[
          trade.season_name||trade.seasonName||'',
          (trade.offered_player_name||trade.offeredPlayerName||'Player')+' ↔ '+(trade.requested_player_name||trade.requestedPlayerName||'Player'),
          'Player: '+(trade.player_response||trade.playerResponse||'—'),
          'Captain: '+(trade.captain_response||trade.captainResponse||'—')
        ].filter(Boolean).join(' · ');
        card.append(title,detail);
        const actions=document.createElement('div');
        actions.className='actions';
        const id=trade.id||trade.tradeId;
        if(id){
          const accept=document.createElement('button');
          accept.type='button';accept.className='primary';accept.textContent='Player accept';
          accept.onclick=()=>respondPlayer(id,'accepted');
          const reject=document.createElement('button');
          reject.type='button';reject.className='ghost';reject.textContent='Player reject';
          reject.onclick=()=>respondPlayer(id,'rejected');
          const capOk=document.createElement('button');
          capOk.type='button';capOk.className='primary';capOk.textContent='Captain approve';
          capOk.onclick=()=>respondCaptain(id,'approved');
          const capNo=document.createElement('button');
          capNo.type='button';capNo.className='ghost';capNo.textContent='Captain reject';
          capNo.onclick=()=>respondCaptain(id,'rejected');
          actions.append(accept,reject,capOk,capNo);
        }
        card.append(actions);
        listEl.append(card);
      }
    }
    async function respondPlayer(tradeId,response){
      setStatus('Saving player response…');
      await api('/api/team-trades/'+encodeURIComponent(tradeId)+'/player-response',{method:'POST',body:JSON.stringify({response})});
      await loadTrades();
      setStatus('Player response saved','ok');
    }
    async function respondCaptain(tradeId,response){
      setStatus('Saving captain response…');
      await api('/api/team-trades/'+encodeURIComponent(tradeId)+'/captain-approval',{method:'POST',body:JSON.stringify({response})});
      await loadTrades();
      setStatus('Captain response saved','ok');
    }
    async function loadTrades(){
      const body=await api('/api/me/trades');
      const trades=(body.tradeManagement&&body.tradeManagement.trades)||body.trades||[];
      renderTrades(Array.isArray(trades)?trades:[]);
    }
    async function propose(event){
      event.preventDefault();
      const teamId=teamSelect.value;
      const offeredPlayerId=document.querySelector('[data-offered-player-id]').value.trim();
      const requestedTeamId=requestedTeamInput.value.trim();
      const requestedPlayerId=document.querySelector('[data-requested-player-id]').value.trim();
      if(!teamId||!offeredPlayerId||!requestedTeamId||!requestedPlayerId)throw new Error('Fill team, both players, and other team id.');
      setStatus('Proposing trade…');
      await api('/api/teams/'+encodeURIComponent(teamId)+'/trades',{
        method:'POST',
        body:JSON.stringify({offeredPlayerId,requestedTeamId,requestedPlayerId}),
      });
      await loadTrades();
      setStatus('Trade proposed','ok');
    }
    async function boot(){
      if(!token()){setStatus('Sign in on Profile to manage trades','muted');return}
      setStatus('Loading…');
      await loadTeams();
      await loadTrades();
      setStatus('Ready','ok');
    }
    document.querySelector('[data-trade-form]').addEventListener('submit',(e)=>propose(e).catch((err)=>setStatus(err.message,'error')));
    document.querySelector('[data-refresh]').addEventListener('click',()=>boot().catch((err)=>setStatus(err.message,'error')));
    teamSelect.addEventListener('change',()=>loadRosterOptions().catch(()=>{}));
    boot().catch((err)=>setStatus(err.message,'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register(()=>loadTrades().catch(()=>{}),{intervalMs:20000,immediate:false});
  </script>
</body>
</html>`;
}
