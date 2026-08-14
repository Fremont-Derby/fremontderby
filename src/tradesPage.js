import { livePageRefreshScript } from './livePageRefresh.js';

export function renderTradesPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Fremont Derby Trades</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972}
    *{box-sizing:border-box}button,select,a{font:inherit;touch-action:manipulation}
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
    select,button{min-height:44px;border-radius:8px;border:1px solid var(--line);background:#0d1013;color:#f5f1e9;padding:0 12px}
    button.primary{background:var(--green);border-color:var(--green);color:#06120d;font-weight:950;cursor:pointer}
    button.ghost{background:transparent;cursor:pointer}
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
    <p class="note">Captains propose a player-for-player swap. Both players and both captains must accept. Captains are not tradable.</p>
    <section class="panel">
      <h2>Propose a trade</h2>
      <form class="grid" data-trade-form>
        <label>My team<select data-team-id required></select></label>
        <label>My player (non-captain)<select data-offered-player-id required></select></label>
        <label>Other team<select data-requested-team-id required></select></label>
        <label>Their player (non-captain)<select data-requested-player-id required></select></label>
        <div class="actions" style="grid-column:1/-1">
          <button class="primary" type="submit">Propose trade</button>
          <button class="ghost" type="button" data-refresh>Refresh</button>
          <a href="/teams" style="color:#9ee5bd;align-self:center">Teams</a>
        </div>
      </form>
    </section>
    <section class="panel">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <h2 style="margin:0">My trades</h2>
        <span data-trade-count>0</span>
      </div>
      <div data-trades-list></div>
      <div class="note" data-trades-empty>No trades yet.</div>
    </section>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const teamSelect=document.querySelector('[data-team-id]');
    const offeredSelect=document.querySelector('[data-offered-player-id]');
    const otherTeamSelect=document.querySelector('[data-requested-team-id]');
    const requestedSelect=document.querySelector('[data-requested-player-id]');
    const listEl=document.querySelector('[data-trades-list]');
    const emptyEl=document.querySelector('[data-trades-empty]');
    const countEl=document.querySelector('[data-trade-count]');
    let captainTeams=[];
    let counterparties=[];
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
    function fillSelect(select,rows,map,emptyLabel){
      select.replaceChildren();
      const ph=document.createElement('option');
      ph.value='';
      ph.textContent=emptyLabel||'Select…';
      select.append(ph);
      for(const row of rows){
        const mapped=map(row);
        if(!mapped.value)continue;
        const opt=document.createElement('option');
        opt.value=mapped.value;
        opt.textContent=mapped.label;
        select.append(opt);
      }
    }
    // Disambiguate same display names in captain trade pickers (identity stays playerId).
    function markDuplicateNames(players){
      const counts=new Map();
      for(const p of players||[]){
        const key=String(p.displayName||p.display_name||'').trim().toLowerCase();
        if(!key)continue;
        counts.set(key,(counts.get(key)||0)+1);
      }
      return (players||[]).map((p)=>{
        const key=String(p.displayName||p.display_name||'').trim().toLowerCase();
        return {...p,isDuplicateName:Boolean(key&&(counts.get(key)||0)>1)};
      });
    }
    function playerOptionLabel(p){
      const name=String(p.displayName||p.display_name||'Player').trim()||'Player';
      if(!p.isDuplicateName)return name;
      const id=String(p.playerId||p.player_id||p.id||'');
      return id.length>=4 ? (name+' · #'+id.slice(-4)) : name;
    }
    function selectedTeam(){
      return captainTeams.find((t)=>(t.teamId||t.team_id)===teamSelect.value)||null;
    }
    function fillOfferedPlayers(){
      const team=selectedTeam();
      const roster=Array.isArray(team&&team.roster)?team.roster:[];
      const players=markDuplicateNames(roster.filter((p)=>String(p.role||'player')==='player'));
      fillSelect(offeredSelect,players,(p)=>({
        value:p.playerId||p.player_id,
        label:playerOptionLabel(p),
      }),players.length?'Select player…':'No non-captain players on roster');
    }
    async function loadCounterparties(){
      const team=selectedTeam();
      const seasonId=team&&(team.seasonId||team.season_id);
      counterparties=[];
      fillSelect(otherTeamSelect,[],()=>({}),'Select other team…');
      fillSelect(requestedSelect,[],()=>({}),'Select their player…');
      if(!seasonId)return;
      try{
        const body=await api('/api/seasons/'+encodeURIComponent(seasonId)+'/trade-counterparties');
        counterparties=body.teams||[];
        fillSelect(otherTeamSelect,counterparties,(t)=>({
          value:t.teamId,
          label:t.teamName+(t.players&&t.players.length?(' · '+t.players.length+' players'):''),
        }),counterparties.length?'Select other team…':'No other teams in season');
      }catch(error){
        fillSelect(otherTeamSelect,[],()=>({}),'Counterparties unavailable');
        setStatus((error&&error.message)?(error.message+' — own roster still works; counterparty list needs the trade options migration.'):'Counterparty list unavailable','error');
      }
    }
    function fillRequestedPlayers(){
      const team=counterparties.find((t)=>t.teamId===otherTeamSelect.value);
      const players=markDuplicateNames((team&&team.players)||[]);
      fillSelect(requestedSelect,players,(p)=>({
        value:p.playerId,
        label:playerOptionLabel(p),
      }),players.length?'Select player…':'No non-captain players');
    }
    async function loadTeams(){
      const body=await api('/api/me/teams');
      captainTeams=(body.teamManagement&&body.teamManagement.captain_teams)||[];
      fillSelect(teamSelect,captainTeams,(t)=>({
        value:t.teamId||t.team_id,
        label:(t.teamName||t.team_name||'Team')+(t.seasonName?(' · '+t.seasonName):''),
      }),captainTeams.length?'Select team…':'No captained teams');
      if(captainTeams[0])teamSelect.value=captainTeams[0].teamId||captainTeams[0].team_id||'';
      fillOfferedPlayers();
      await loadCounterparties();
    }
    function renderTrades(trades){
      listEl.replaceChildren();
      countEl.textContent=String(trades.length);
      emptyEl.hidden=trades.length>0;
      for(const trade of trades){
        const card=document.createElement('article');
        card.style.cssText='border-bottom:1px solid var(--line);padding:10px 0';
        card.innerHTML='<strong>'+String(trade.status||'pending')+'</strong><div class="note">'
          +[(trade.season_name||trade.seasonName||''),
            (trade.offered_player_name||trade.offeredPlayerName||'Player')+' ↔ '+(trade.requested_player_name||trade.requestedPlayerName||'Player'),
            'Player: '+(trade.player_response||trade.playerResponse||'—'),
            'Captain: '+(trade.captain_response||trade.captainResponse||'—')].filter(Boolean).join(' · ')+'</div>';
        const id=trade.id||trade.tradeId;
        if(id){
          const actions=document.createElement('div');
          actions.className='actions';
          const mk=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=()=>fn().catch((e)=>setStatus(e.message,'error'));return b};
          actions.append(
            mk('Player accept','primary',()=>api('/api/team-trades/'+encodeURIComponent(id)+'/player-response',{method:'POST',body:JSON.stringify({response:'accepted'})}).then(loadTrades)),
            mk('Player reject','ghost',()=>api('/api/team-trades/'+encodeURIComponent(id)+'/player-response',{method:'POST',body:JSON.stringify({response:'rejected'})}).then(loadTrades)),
            mk('Captain approve','primary',()=>api('/api/team-trades/'+encodeURIComponent(id)+'/captain-approval',{method:'POST',body:JSON.stringify({response:'approved'})}).then(loadTrades)),
            mk('Captain reject','ghost',()=>api('/api/team-trades/'+encodeURIComponent(id)+'/captain-approval',{method:'POST',body:JSON.stringify({response:'rejected'})}).then(loadTrades)),
          );
          card.append(actions);
        }
        listEl.append(card);
      }
    }
    async function loadTrades(){
      const body=await api('/api/me/trades');
      const trades=(body.tradeManagement&&body.tradeManagement.trades)||[];
      renderTrades(Array.isArray(trades)?trades:[]);
    }
    async function propose(event){
      event.preventDefault();
      const teamId=teamSelect.value;
      const offeredPlayerId=offeredSelect.value;
      const requestedTeamId=otherTeamSelect.value;
      const requestedPlayerId=requestedSelect.value;
      if(!teamId||!offeredPlayerId||!requestedTeamId||!requestedPlayerId)throw new Error('Choose team and both players.');
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
    teamSelect.addEventListener('change',()=>{fillOfferedPlayers();loadCounterparties().catch((e)=>setStatus(e.message,'error'))});
    otherTeamSelect.addEventListener('change',fillRequestedPlayers);
    boot().catch((err)=>setStatus(err.message,'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register(()=>loadTrades().catch(()=>{}),{intervalMs:20000,immediate:false});
  </script>
</body>
</html>`;
}
