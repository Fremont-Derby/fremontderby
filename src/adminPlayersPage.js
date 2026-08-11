export function renderAdminPlayersPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Player Management · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter,ui-sans-serif,system-ui,sans-serif; background:#0d1110; color:#f3f6f4; --panel:#17201c; --line:#31443a; --muted:#a9b8b0; --green:#45b77c; --gold:#e2bd58; --red:#e36b62; }
    *{box-sizing:border-box} body{margin:0;background:#0d1110} button,input,textarea{font:inherit} button,a,input,textarea{border-radius:10px} button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #9ee5bd;outline-offset:2px}
    .app{width:min(980px,100%);margin:auto;padding:18px}.head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;margin-bottom:16px}.head h1{margin:0 0 4px;font-size:clamp(1.7rem,6vw,2.5rem)}.muted{color:var(--muted);line-height:1.45}.back{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border:1px solid var(--line);color:#dff0e6;text-decoration:none;white-space:nowrap}.panel{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:14px}.search{display:grid;grid-template-columns:1fr auto;gap:10px}.search input{min-height:48px;padding:0 14px;border:1px solid var(--line);background:#0b100e;color:#fff}.search button,.action{min-height:48px;padding:0 16px;border:1px solid transparent;font-weight:850;cursor:pointer}.search button{background:var(--green);color:#07140d}.status{margin:12px 0 0;min-height:24px;color:var(--muted)}.status[data-tone=error]{color:#ffb5ae}.status[data-tone=ok]{color:#a9e7c0}.list{display:grid;gap:10px;margin-top:14px}.card{border:1px solid var(--line);border-radius:12px;background:#111814;padding:14px;display:grid;gap:12px}.identity{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.identity h2{margin:0;font-size:1.15rem}.badges{display:flex;flex-wrap:wrap;gap:6px}.badge{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#26342d;color:#dce8e1;font-size:.76rem;font-weight:850}.badge.admin{background:#4b3b13;color:#ffe597}.teams{display:flex;flex-wrap:wrap;gap:7px}.team{padding:7px 9px;border:1px solid var(--line);border-radius:9px;color:#cbd8d1;font-size:.82rem}.role-box{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}.role-box textarea{width:100%;min-height:72px;padding:10px;border:1px solid var(--line);background:#0b100e;color:#fff;resize:vertical}.action.grant{background:var(--green);color:#06150d}.action.revoke{background:transparent;color:#ffb5ae;border-color:#7f3f39}.action:disabled{opacity:.45;cursor:not-allowed}.empty{padding:22px 8px;text-align:center;color:var(--muted)}
    @media(max-width:640px){.app{padding:12px}.head{display:grid}.back{width:100%;justify-content:center}.search,.role-box{grid-template-columns:1fr}.identity{display:grid}.action{width:100%}}
  </style>
</head>
<body>
  <main class="app">
    <header class="head"><div><div class="muted">Admin · League Management</div><h1>Players</h1><div class="muted">Find a player, review their teams, and manage league-admin access. Eligibility and roster exceptions are the next slice.</div></div><a class="back" href="/admin/operations">Operations</a></header>
    <section class="panel">
      <form class="search" data-search-form><input data-search type="search" autocomplete="off" placeholder="Search player name" aria-label="Search players"/><button type="submit">Find player</button></form>
      <div class="status" role="status" aria-live="polite" data-status>Checking admin access…</div>
      <div class="list" data-list hidden></div>
      <div class="empty" data-empty hidden>No players match that search.</div>
    </section>
  </main>
  <script>
    const listEl=document.querySelector('[data-list]'); const emptyEl=document.querySelector('[data-empty]'); const statusEl=document.querySelector('[data-status]'); const searchEl=document.querySelector('[data-search]');
    let players=[];
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    function setStatus(message,tone=''){statusEl.textContent=message;statusEl.dataset.tone=tone}
    async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
    async function api(path,options={}){const accessToken=token();if(!accessToken)throw new Error('Sign in from Profile to use league admin tools.');const response=await fetch(path,{...options,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json',...(options.headers||{})}});const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body}
    function node(tag,text,className){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el}
    function render(){const q=searchEl.value.trim().toLowerCase();const shown=players.filter(p=>!q||p.displayName.toLowerCase().includes(q));listEl.replaceChildren();emptyEl.hidden=shown.length>0;listEl.hidden=shown.length===0;for(const player of shown){const card=node('article',null,'card');const identity=node('div',null,'identity');const who=node('div');who.append(node('h2',player.displayName));const badges=node('div',null,'badges');badges.append(node('span',player.hasLogin?'Signed in before':'No login yet','badge'));if(player.isLeagueAdmin)badges.append(node('span','League admin','badge admin'));identity.append(who,badges);card.append(identity);const teams=node('div',null,'teams');if(player.teams.length){for(const team of player.teams)teams.append(node('span',team.teamName+' · '+team.seasonName+' · '+team.role,'team'))}else teams.append(node('span','No active team memberships','muted'));card.append(teams);const roleBox=node('div',null,'role-box');const label=node('label');label.append(node('span','Reason / note (optional)','muted'));const reason=document.createElement('textarea');reason.maxLength=500;reason.placeholder=player.isLeagueAdmin?'Why are you removing admin access?':'Why are you granting admin access?';label.append(reason);const button=node('button',player.isLeagueAdmin?'Revoke admin':'Grant admin','action '+(player.isLeagueAdmin?'revoke':'grant'));button.type='button';button.disabled=!player.hasLogin;button.addEventListener('click',async()=>{const verb=player.isLeagueAdmin?'revoke':'grant';if(!confirm('Confirm: '+verb+' league-admin access for '+player.displayName+'?'))return;button.disabled=true;try{await api('/api/admin/players/'+encodeURIComponent(player.playerId)+'/admin-role',{method:'PUT',body:JSON.stringify({enabled:!player.isLeagueAdmin,reason:reason.value.trim()})});player.isLeagueAdmin=!player.isLeagueAdmin;setStatus(player.displayName+(player.isLeagueAdmin?' now has league-admin access.':' no longer has league-admin access.'),'ok');render()}catch(error){setStatus(error.message,'error');button.disabled=false}});roleBox.append(label,button);card.append(roleBox);listEl.append(card)}}
    async function load(){setStatus('Loading players…');const body=await api('/api/admin/players');players=Array.isArray(body.players)?body.players:[];render();setStatus(players.length+' player'+(players.length===1?'':'s')+' loaded.','ok')}
    document.querySelector('[data-search-form]').addEventListener('submit',event=>{event.preventDefault();render()});searchEl.addEventListener('input',render);
    load().catch(error=>{listEl.hidden=true;emptyEl.hidden=true;setStatus(error.message,'error')});
  </script>
</body>
</html>`;
}
