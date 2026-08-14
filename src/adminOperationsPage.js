import { safeAutocompleteClientScript } from './safeAutocomplete.js';
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
}

export function renderAdminOperationsPage(env = {}) {
  const config = safeJson({
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>League operations · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#07150f;color:#f4f7f5;--panel:#0b2418;--line:#315d45;--muted:#afc1b6;--green:#39b979;--gold:#e9bd45;--danger:#d95d53;--focus:#bcebd0}*{box-sizing:border-box}button,a,summary,select{touch-action:manipulation;-webkit-tap-highlight-color:transparent}input,select,textarea{font-size:16px}body{margin:0;min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% 0,#123b28,#07150f 34rem)}button{font:inherit}.app{width:min(1120px,100%);margin:auto;padding:18px 16px 36px}.head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:16px}.head h1{margin:0;font-size:clamp(1.8rem,7vw,3rem)}.sub{color:var(--muted);line-height:1.5}.head-actions{display:grid;gap:8px;justify-items:end}.admin-links{display:flex;gap:10px;flex-wrap:wrap}.admin-links a,.recovery a{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:#bcebd0;font-weight:850;text-decoration:none}.admin-links a:focus-visible,.recovery a:focus-visible,.action a:focus-visible,button:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.status{padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#0a1c13;color:var(--muted)}.status[data-tone="error"]{border-color:#98483f;color:#ffb3ac}.status[data-tone="warning"]{border-color:#8f722a;color:#f4dc97}.status[data-tone="healthy"]{border-color:#357a54;color:#a9e6c2}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.metric,.panel{border:1px solid var(--line);border-radius:13px;background:var(--panel)}.metric{padding:13px;display:grid;gap:6px}.metric span{color:var(--muted);font-size:.72rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:1.55rem}.layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:12px}.panel{padding:14px;min-width:0}.panel h2{margin:0 0 12px;font-size:1.05rem}.actions,.detail-grid{display:grid;gap:9px}.action{padding:12px;border:1px solid var(--line);border-left-width:5px;border-radius:10px;background:#081a12}.action[data-severity="critical"]{border-left-color:var(--danger)}.action[data-severity="warning"]{border-left-color:var(--gold)}.action[data-severity="healthy"]{border-left-color:var(--green)}.action-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.action strong{display:block}.severity{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border:1px solid var(--line);border-radius:999px;font-size:.69rem;font-weight:950;letter-spacing:.06em;text-transform:uppercase}.severity[data-severity="critical"]{border-color:#b8645c;color:#ffd0cb;background:#341715}.severity[data-severity="warning"]{border-color:#9f8030;color:#ffe7a6;background:#30260d}.severity[data-severity="healthy"]{border-color:#438a61;color:#c8f2d8;background:#0f2c1c}.action p{margin:6px 0;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}.action a{min-height:44px;display:inline-flex;align-items:center;padding:0 2px;color:#bcebd0;font-weight:850}.row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid var(--line)}.row:last-child{border-bottom:0}.row span{color:var(--muted)}.row strong{overflow-wrap:anywhere;text-align:right}.empty{padding:18px;border:1px dashed var(--line);border-radius:10px;color:var(--muted)}.recovery{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{min-height:44px;padding:0 13px;border:1px solid var(--line);border-radius:10px;background:#173f2a;color:#f4f7f5;font-weight:850;cursor:pointer}@media(max-width:760px){.app{padding:12px 10px 28px}.head{display:grid}.head-actions{justify-items:start}.metrics{grid-template-columns:1fr 1fr}.layout{grid-template-columns:1fr}.status{text-align:left}.row{align-items:flex-start}.row strong{max-width:55%}}@media(max-width:420px){.metrics{grid-template-columns:1fr}.admin-links,.recovery{display:grid;width:100%}.admin-links a,.recovery a{width:100%;justify-content:center}.action a{width:100%;justify-content:flex-start}}
  </style>
</head>
<body>
  <main class="app">
    <header class="head"><div><h1>League operations</h1><div class="sub" data-season>Is Fremont Derby running smoothly?</div></div><div class="head-actions"><nav class="admin-links" aria-label="Admin tools"><a href="/admin/players">Players</a><a href="/season-setup">Season setup</a><a href="/messages/moderation">Moderation</a><a href="/admin/audit">Audit log</a></nav><div class="status" role="status" aria-live="polite" data-status>Loading league health…</div><button data-refresh type="button">Refresh</button></div></header>
    <section class="metrics" aria-label="League summary">
      <div class="metric"><span>Players</span><strong data-count="seasonPlayers">—</strong></div>
      <div class="metric"><span>Teams</span><strong data-count="teams">—</strong></div>
      <div class="metric"><span>Paid</span><strong data-count="paidPlayers">—</strong></div>
      <div class="metric"><span>Messages</span><strong data-count="messages">—</strong></div>
    </section>
    <section class="layout">
      <article class="panel"><h2>Needs attention</h2><div class="actions" data-actions></div></article>
      <div class="detail-grid">
        <article class="panel"><h2>League night</h2><div data-league></div></article>
        <article class="panel"><h2>Communication</h2><div data-communication></div></article>
        <article class="panel"><h2>Ratings and system</h2><div data-system></div></article>
      </div>
    </section>
  <section class="panel" data-broadcast>
      <h2>League broadcast</h2>
      <p class="muted">Send a notice to all active players (or the selected season). Appears in Notifications.</p>
      <label>Title<input data-broadcast-title data-safe-ac-candidates='["Weather update","Venue change","Payment deadline","Schedule change","Registration open","Playoff brackets posted"]' maxlength="120" placeholder="Weather / venue update" /></label>
      <label>Message<textarea data-broadcast-body maxlength="500" rows="3"></textarea></label>
      <button type="button" class="primary" data-broadcast-send>Send broadcast</button>
    </section>
    </main>
  <script>
    const config=${config};const statusEl=document.querySelector('[data-status]');const seasonEl=document.querySelector('[data-season]');const actionsEl=document.querySelector('[data-actions]');
    function token(){return sessionStorage.getItem('fd.accessToken')||''}function refreshToken(){return sessionStorage.getItem('fd.refreshToken')||''}
    async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
    async function refreshSession(){if(!config.supabaseUrl||!config.supabasePublishableKey||!refreshToken())return false;const response=await fetch(config.supabaseUrl.replace(/\\\/+$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.supabasePublishableKey,'content-type':'application/json'},body:JSON.stringify({refresh_token:refreshToken()})});if(!response.ok)return false;const body=await parseJson(response);if(!body.access_token)return false;sessionStorage.setItem('fd.accessToken',body.access_token);if(body.refresh_token)sessionStorage.setItem('fd.refreshToken',body.refresh_token);return true}
    async function api(retry=true){if(!token())throw new Error('Sign in with a league admin account.');const response=await fetch('/api/admin/operations',{headers:{authorization:'Bearer '+token()}});if(response.status===401&&retry&&await refreshSession())return api(false);const body=await parseJson(response);if(!response.ok){const error=new Error(body.error||'Request failed');error.status=response.status;throw error}return body}
    function value(input){return input==null?'—':String(input)}function row(label,input){const div=document.createElement('div');div.className='row';const name=document.createElement('span');name.textContent=label;const strong=document.createElement('strong');strong.textContent=value(input);div.append(name,strong);return div}function formatTime(input){if(!input)return'Never';const date=new Date(input);return Number.isNaN(date.valueOf())?'Unknown':new Intl.DateTimeFormat([],{dateStyle:'medium',timeStyle:'short'}).format(date)}
    function renderRows(target,items){target.replaceChildren(...items.map(([label,input])=>row(label,input)))}
    function severityLabel(severity){return severity==='critical'?'Critical':severity==='warning'?'Warning':'Ready'}
    function actionCard(item){const card=document.createElement('article');card.className='action';card.dataset.severity=item.severity;const head=document.createElement('div');head.className='action-head';const severity=document.createElement('span');severity.className='severity';severity.dataset.severity=item.severity;severity.textContent=severityLabel(item.severity);const title=document.createElement('strong');title.textContent=item.title;head.append(severity,title);const detail=document.createElement('p');detail.textContent=item.detail;card.append(head,detail);if(item.href){const link=document.createElement('a');link.href=item.href;link.textContent='Open: '+item.title;card.append(link)}return card}
    function render(overview){statusEl.textContent=overview.overall==='healthy'?'All monitored checks are healthy':overview.overall==='critical'?'Critical attention required':'Review recommended';statusEl.dataset.tone=overview.overall==='healthy'?'ok':overview.overall==='critical'?'error':overview.overall==='warning'?'warning':(overview.overall||'muted');seasonEl.textContent=overview.season?overview.season.name+' · '+overview.season.status:'No current season';for(const element of document.querySelectorAll('[data-count]'))element.textContent=value(overview.counts[element.dataset.count]);actionsEl.replaceChildren();if(!overview.actions.length){actionsEl.append(actionCard({severity:'healthy',title:'No action needed',detail:'All currently monitored checks are healthy.'}))}for(const item of overview.actions)actionsEl.append(actionCard(item));renderRows(document.querySelector('[data-league]'),[['Rounds',overview.counts.rounds],['Team matchups',overview.counts.teamMatches],['Lineups',overview.counts.lineups],['Player matches',overview.counts.playerMatches],['Live',overview.counts.liveMatches],['Finalized',overview.counts.finalizedMatches],['Score mismatches',overview.counts.scoreMismatches],['Forfeits',overview.counts.forfeits]]);renderRows(document.querySelector('[data-communication]'),[['Team',overview.counts.teamMessages],['Direct',overview.counts.directMessages],['League',overview.counts.leagueMessages],['Matchup',overview.counts.matchupMessages],['Open reports',overview.counts.openReports]]);renderRows(document.querySelector('[data-system]'),[['Rating records',overview.counts.ratings],['Latest rating update',formatTime(overview.rating.latestUpdatedAt)],['Environment',overview.environment.environment],['Supabase project',overview.environment.supabase.projectRef||'Unknown'],['Binding health',overview.environment.ok?'Healthy':'Needs attention']])}
    function renderFailure(error){statusEl.textContent=error.status===403?'League admin access required':error.message;statusEl.dataset.tone='error';actionsEl.replaceChildren();const card=document.createElement('div');card.className='empty';card.textContent=error.status===403?'This page is available only to league admins.':'Operations could not load. No league data was changed.';const recovery=document.createElement('div');recovery.className='recovery';const profile=document.createElement('a');profile.href='/profile';profile.textContent='Open Profile';recovery.append(profile);if(error.status!==403){const retry=document.createElement('a');retry.href='/admin/operations';retry.textContent='Try again';recovery.append(retry)}actionsEl.append(card,recovery)}
    async function load(){statusEl.textContent='Loading league health…';statusEl.dataset.tone='';try{const body=await api();render(body.overview)}catch(error){renderFailure(error)}}
    document.querySelector('[data-refresh]').addEventListener('click',load);load();
    if(window.fdLiveRefresh)window.fdLiveRefresh.register(()=>load(),{intervalMs:30000,immediate:false});
  
    const broadcastSend=document.querySelector('[data-broadcast-send]');
    if(broadcastSend){
      broadcastSend.addEventListener('click',async()=>{
        const title=document.querySelector('[data-broadcast-title]')?.value?.trim()||'';
        const body=document.querySelector('[data-broadcast-body]')?.value?.trim()||'';
        const token=sessionStorage.getItem('fd.accessToken')||'';
        try{
          const response=await fetch('/api/admin/notifications/broadcast',{
            method:'POST',
            headers:{authorization:'Bearer '+token,'content-type':'application/json'},
            body:JSON.stringify({title,body,href:'/notifications'}),
          });
          const json=await response.json().catch(()=>({}));
          if(!response.ok)throw new Error(json.error||'Broadcast failed');
          alert('Sent to '+(json.sent||0)+' players');
        }catch(error){alert(error.message)}
      });
    }
    </script>
${safeAutocompleteClientScript}
</body>
</html>`;
}
