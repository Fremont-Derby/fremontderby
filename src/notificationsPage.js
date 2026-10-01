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
      <a class="ghost" href="/lineup">Lineup</a>
      <a class="ghost" href="/availability">Check in</a>
      <a class="ghost" href="/trades">Trades</a>
      <a class="ghost" href="/standings">Standings</a>
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
    function resolveHref(item){
      if(item.href) return item.href;
      const blob=((item.title||'')+' '+(item.body||'')+' '+(item.type||'')+' '+(item.kind||'')).toLowerCase();
      if(blob.includes('ready check')||blob.includes('ready-check')) return '/teams';
      if(blob.includes('lineup')) return '/lineup';
      if(blob.includes('score')||blob.includes('rack')||blob.includes('match')) return '/scorecard';
      if(blob.includes('trade')) return '/trades';
      if(blob.includes('invite')||blob.includes('invitation')) return '/teams';
      if(blob.includes('availability')||blob.includes('check-in')||blob.includes('check in')) return '/availability';
      if(blob.includes('message')||blob.includes('chat')) return '/messages';
      if(blob.includes('standings')) return '/standings';
      if(blob.includes('schedule')||blob.includes('makeup')) return '/schedule';
      return '';
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
      const href=resolveHref(item);
      if(href){
        const link=document.createElement('a');
        link.href=href;
        link.textContent='Open';
        link.style.cssText='display:inline-flex;min-height:44px;align-items:center;margin-top:6px';
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
      if(!items.length){
        listEl.replaceChildren();
        const empty=document.createElement('div');
        empty.className='item';
        empty.innerHTML='<strong>No notices yet</strong><div class="muted">League broadcasts and team alerts will show up here.</div>';
        const links=document.createElement('div');
        links.className='actions';
        for(const [label,href] of [['Schedule','/schedule'],['Score','/scorecard'],['Lineup','/lineup'],['Teams','/teams'],['Messages','/messages']]){
          const a=document.createElement('a');a.href=href;a.textContent=label;links.append(a);
        }
        empty.append(links);
        listEl.append(empty);
        return;
      }
      if(window.fdStableList){
        window.fdStableList(listEl,items,{
          key:(item)=>String(item.id||item.title||''),
          signature:(item)=>[item.title,item.body,item.readAt,resolveHref(item)].join('|'),
          render:(item)=>buildNotificationCard(item),
        });
        return;
      }
      listEl.replaceChildren();
      for(const item of items) listEl.append(buildNotificationCard(item));
    }
    async function load(opts={}){
      const quiet=Boolean(opts&&opts.quiet);
      if(!token()){setStatus('Sign in required','muted');listEl.replaceChildren();const empty=document.createElement('div');empty.className='item';empty.innerHTML='<strong>Sign in to see notices</strong><div class="muted">Notifications follow your player account.</div>';const a=document.createElement('a');a.href='/profile';a.textContent='Open Profile';empty.append(a);listEl.append(empty);return}
      if(!quiet) setStatus('Loading…','muted',{quiet:false});
      const body=await api('/api/me/notifications');
      render(body.notifications||[]);
      const unread=(body.notifications||[]).filter((n)=>!n.readAt).length;
      setStatus(unread?unread+' unread':'Up to date','ok');
    }
    document.querySelector('[data-mark-all]').addEventListener('click',async()=>{
      try{await api('/api/me/notifications/read-all',{method:'POST'});try{window.dispatchEvent(new CustomEvent('fd:notifications-changed'))}catch(_){ }await load()}
      catch(error){setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error')}
    });
    load().catch((error)=>setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>load(opts).catch(()=>{}),{intervalMs:30000,immediate:false});
  </script>
</body>
</html>`;
}
