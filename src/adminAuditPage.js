import { designSystemStyles } from './designSystem.js';
import { livePageRefreshScript } from './livePageRefresh.js';

export function renderAdminAuditPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Admin audit log · Fremont Derby</title>
  <style>
    ${designSystemStyles}
    .filters{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0;align-items:end}
    .filters label{display:grid;gap:4px;font-size:.78rem;color:var(--muted)}
    .list{display:grid;gap:10px}
    .item{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel)}
    .item header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .meta{color:var(--muted);font-size:.82rem}
    .reason{margin-top:6px}
    details{margin-top:8px}
    pre{white-space:pre-wrap;word-break:break-word;font-size:.75rem;background:#0d1013;padding:8px;border-radius:8px}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Admin audit log</span></div>
      <div class="status" data-status aria-live="polite">Loading…</div>
    </header>
    <p class="muted">League-admin actions with actor, time, and detail. Visible only to league admins.</p>
    <nav class="filters">
      <a class="ghost" href="/admin/operations">Operations</a>
      <a class="ghost" href="/messages/moderation">Moderation</a>
      <a class="ghost" href="/admin/players">Players</a>
      <a class="ghost" href="/admin/seasons">Seasons</a>
      <a class="ghost" href="/admin/season-teams">Season teams</a>
      <a class="ghost" href="/admin">Admin home</a>
    </nav>
    <div class="filters">
      <label>Action prefix
        <input data-prefix placeholder="e.g. player.admin or chat." />
      </label>
      <button type="button" class="primary" data-refresh>Refresh</button>
      <button type="button" data-flush-webhooks title="Deliver pending audit webhooks">Flush webhooks</button>
    </div>
    <div class="filters" data-prefix-chips aria-label="Quick action filters">
      <button type="button" data-prefix-chip value="">All</button>
      <button type="button" data-prefix-chip value="player.">player.</button>
      <button type="button" data-prefix-chip value="team.">team.</button>
      <button type="button" data-prefix-chip value="team_match.">team_match.</button>
      <button type="button" data-prefix-chip value="team_invitation.">invitation.</button>
      <button type="button" data-prefix-chip value="team_trade.">trade.</button>
      <button type="button" data-prefix-chip value="season.">season.</button>
      <button type="button" data-prefix-chip value="player_match.">player_match.</button>
    </div>
    <section class="list" data-list></section>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const listEl=document.querySelector('[data-list]');
    const prefixEl=document.querySelector('[data-prefix]');
    function setStatus(message,tone,opts){if(window.fdSetStatus){window.fdSetStatus(statusEl,message,tone||'muted',opts||{});return}statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function api(path,options={}){
      const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json',...(options.headers||{})}});
      const body=await response.json().catch(()=>({}));
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');throw new Error('Sign in on Profile first.');}
      if(response.status===403)throw new Error('League admin access is required.');
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    function fmtTime(value){
      if(!value)return '—';
      try{return new Date(value).toLocaleString()}catch{return String(value)}
    }
    function render(events){
      if(!events.length){
        listEl.replaceChildren();
        listEl.textContent='No audit events yet.';
        return;
      }
      function buildAuditCard(event){
        const card=document.createElement('article');
        card.className='item';
        const head=document.createElement('header');
        const left=document.createElement('div');
        const title=document.createElement('strong');
        title.textContent=event.action;
        const meta=document.createElement('div');
        meta.className='meta';
        meta.textContent=(event.actorDisplayName||'Unknown admin')+' · '+event.entityType+' · '+String(event.entityId||'').slice(0,8);
        left.append(title,meta);
        const when=document.createElement('div');
        when.className='meta';
        when.textContent=fmtTime(event.createdAt);
        head.append(left,when);
        card.append(head);
        if(event.reason){
          const reason=document.createElement('div');
          reason.className='reason';
          reason.textContent='Reason: '+event.reason;
          card.append(reason);
        }
        if(event.beforeState||event.afterState){
          const details=document.createElement('details');
          const summary=document.createElement('summary');
          summary.textContent='State change';
          const pre=document.createElement('pre');
          pre.textContent=JSON.stringify({before:event.beforeState,after:event.afterState},null,2);
          details.append(summary,pre);
          card.append(details);
        }
        return card;
      }
      if(window.fdStableList){
        window.fdStableList(listEl,events,{
          key:(e)=>String(e.id||e.eventId||(e.action+e.createdAt+e.entityId)),
          signature:(e)=>[e.action,e.reason,e.createdAt,e.actorDisplayName].join('|'),
          render:(e)=>buildAuditCard(e),
        });
      }else{
        listEl.replaceChildren();
        for(const event of events) listEl.append(buildAuditCard(event));
      }
    }
    async function load(opts={}){
      const quiet=Boolean(opts&&opts.quiet);
      if(!token()){setStatus('Sign in required','muted');listEl.textContent='Open Profile and sign in as a league admin.';return}
      if(!quiet) setStatus('Loading audit log…');
      const prefix=prefixEl.value.trim();
      const qs=prefix?('?prefix='+encodeURIComponent(prefix)):'';
      const body=await api('/api/admin/audit-events'+qs);
      render(body.events||[]);
      setStatus((body.events||[]).length+' event(s)','ok');
    }
    document.querySelector('[data-refresh]').addEventListener('click',()=>load().catch((e)=>setStatus(e.message,'error')));
    document.querySelector('[data-flush-webhooks]').addEventListener('click',async()=>{
      try{
        const body=await api('/api/admin/audit-webhooks/flush',{method:'POST'});
        setStatus('Webhooks delivered: '+(body.delivered||0),'ok');
      }catch(error){setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error')}
    });
    prefixEl.addEventListener('change',()=>load().catch((e)=>setStatus(e.message,'error')));
    document.querySelectorAll('[data-prefix-chip]').forEach((btn)=>{
      btn.addEventListener('click',()=>{
        prefixEl.value=btn.getAttribute('value')||'';
        load().catch((e)=>setStatus(e.message,'error'));
      });
    });
    load().catch((e)=>setStatus(e.message,'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>load(opts).catch(()=>{}),{intervalMs:15000,immediate:false});
  </script>
</body>
</html>`;
}
