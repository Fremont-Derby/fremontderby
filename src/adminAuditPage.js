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
    </nav>
    <div class="filters">
      <label>Action prefix
        <input data-prefix placeholder="e.g. player.admin or chat." />
      </label>
      <button type="button" class="primary" data-refresh>Refresh</button>
      <button type="button" data-flush-webhooks title="Deliver pending audit webhooks">Flush webhooks</button>
    </div>
    <section class="list" data-list></section>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const listEl=document.querySelector('[data-list]');
    const prefixEl=document.querySelector('[data-prefix]');
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}
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
      listEl.replaceChildren();
      if(!events.length){listEl.textContent='No audit events yet.';return}
      for(const event of events){
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
        listEl.append(card);
      }
    }
    async function load(){
      if(!token()){setStatus('Sign in required','muted');listEl.textContent='Open Profile and sign in as a league admin.';return}
      setStatus('Loading audit log…');
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
      }catch(error){setStatus(error.message,'error')}
    });
    prefixEl.addEventListener('change',()=>load().catch((e)=>setStatus(e.message,'error')));
    load().catch((e)=>setStatus(e.message,'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register(()=>load().catch(()=>{}),{intervalMs:15000,immediate:false});
  </script>
</body>
</html>`;
}
