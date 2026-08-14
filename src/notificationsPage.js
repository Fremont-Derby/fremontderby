import { designSystemStyles } from './designSystem.js';
import { livePageRefreshScript } from './livePageRefresh.js';

export function renderNotificationsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Notifications · Fremont Derby</title>
  <style>
    ${designSystemStyles}
    .list{display:grid;gap:10px}
    .item{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel)}
    .item[data-unread="true"]{border-color:#9ee5bd}
    .actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .actions a,button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;border-radius:10px;text-decoration:none}
    @media(max-width:720px){.actions{flex-direction:column;align-items:stretch}.app{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Notifications</span></div>
      <div class="status" data-status aria-live="polite">Loading…</div>
    </header>
    <div class="actions">
      <button type="button" class="primary" data-mark-all>Mark all read</button>
      <a class="ghost" href="/messages">Open messages</a>
      <a class="ghost" href="/teams">Teams</a>
      <a class="ghost" href="/players">Players</a>
      <a class="ghost" href="/schedule">Schedule</a>
      <a class="ghost" href="/scorecard">Score</a>
    </div>
    <section class="list" data-list></section>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const listEl=document.querySelector('[data-list]');
    function setStatus(message,tone,opts){if(window.fdSetStatus){window.fdSetStatus(statusEl,message,tone||'muted',opts||{});return}statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function api(path,options={}){
      const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json',...(options.headers||{})}});
      const body=await response.json().catch(()=>({}));
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');throw new Error('Sign in on Profile first.');}
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    function buildNotificationCard(item){
      const card=document.createElement('article');
      card.className='item';
      card.dataset.unread=String(!item.readAt);
      const title=document.createElement('strong');
      title.textContent=item.title;
      const body=document.createElement('div');
      body.className='muted';
      body.textContent=item.body;
      card.append(title,body);
      if(item.href){
        const link=document.createElement('a');
        link.href=item.href;
        link.textContent='Open';
        card.append(link);
      }
      if(!item.readAt){
        const mark=document.createElement('button');
        mark.type='button';
        mark.textContent='Mark read';
        mark.addEventListener('click',async()=>{
          try{await api('/api/me/notifications/'+encodeURIComponent(item.id)+'/read',{method:'POST'});await load()}
          catch(error){setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error')}
        });
        card.append(mark);
      }
      return card;
    }
    function render(items){
      if(!items.length){listEl.replaceChildren();listEl.textContent='No notifications yet.';return}
      if(window.fdStableList){
        window.fdStableList(listEl,items,{
          key:(item)=>String(item.id||item.title||''),
          signature:(item)=>[item.title,item.body,item.readAt,item.href].join('|'),
          render:(item)=>buildNotificationCard(item),
        });
        return;
      }
      listEl.replaceChildren();
      for(const item of items) listEl.append(buildNotificationCard(item));
    }
    async function load(opts={}){
      const quiet=Boolean(opts&&opts.quiet);
      if(!token()){setStatus('Sign in required','muted');listEl.textContent='Open Profile and sign in to see notifications.';return}
      if(!quiet) setStatus('Loading…','muted',{quiet:false});
      const body=await api('/api/me/notifications');
      render(body.notifications||[]);
      const unread=(body.notifications||[]).filter((n)=>!n.readAt).length;
      setStatus(unread?unread+' unread':'Up to date','ok');
    }
    document.querySelector('[data-mark-all]').addEventListener('click',async()=>{
      try{await api('/api/me/notifications/read-all',{method:'POST'});await load()}
      catch(error){setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error')}
    });
    load().catch((error)=>setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>load(opts).catch(()=>{}),{intervalMs:30000,immediate:false});
  </script>
</body>
</html>`;
}
