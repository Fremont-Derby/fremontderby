export function renderNotificationsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Notifications · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111316}
    .app{width:min(720px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{display:flex;align-items:center;gap:10px;font-weight:950}
    .mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%);color:#111;font-weight:950}
    .status{min-height:28px;color:var(--muted);text-align:right}
    .status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}
    .note{color:var(--muted);line-height:1.5}
    .summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .summary div{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .summary span{display:block;color:var(--muted);font-size:.72rem;font-weight:850;text-transform:uppercase}
    .summary strong{display:block;margin-top:4px;font-size:1.2rem}
    .list{display:grid;gap:8px}
    .item{padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .item a{color:#9ee5bd}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .actions a{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font:inherit;font-weight:800}
    .empty{color:var(--muted);padding:8px 0}
    @media(max-width:720px){.summary{grid-template-columns:1fr}.status{text-align:left}}
  </style>
</head>
<body>
  <main class="app" data-fd-notifications="true">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Notifications</span></div>
      <div class="status" data-status aria-live="polite">Loading inbox…</div>
    </header>
    <p class="note">League alerts and unread message counts. Open Messages for the conversation itself.</p>
    <div class="summary">
      <div><span>Unread messages</span><strong data-unread>—</strong></div>
      <div><span>Alerts</span><strong data-alert-count>—</strong></div>
    </div>
    <section class="list" data-list></section>
    <p class="empty" data-empty hidden>No notifications yet.</p>
    <div class="actions">
      <a href="/messages">Messages</a>
      <a href="/profile">Sign in</a>
      <a href="/teams">Teams</a>
      <a href="/schedule">Schedule</a>
    </div>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]');
    const unreadEl=document.querySelector('[data-unread]');
    const alertEl=document.querySelector('[data-alert-count]');
    const listEl=document.querySelector('[data-list]');
    const emptyEl=document.querySelector('[data-empty]');
    function setStatus(m,t){statusEl.textContent=m;statusEl.dataset.tone=t||'muted'}
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function loadJson(path){
      const headers={};
      if(token()) headers.authorization='Bearer '+token();
      const response=await fetch(path,{headers});
      const body=await response.json().catch(()=>({}));
      return {ok:response.ok,status:response.status,body};
    }
    function card(title,body,href){
      const item=document.createElement('article');
      item.className='item';
      const strong=document.createElement('strong');
      strong.textContent=title;
      const p=document.createElement('div');
      p.className='empty';
      p.textContent=body;
      item.append(strong,p);
      if(href){const a=document.createElement('a');a.href=href;a.textContent='Open';item.append(a)}
      return item;
    }
    async function boot(){
      listEl.replaceChildren();
      const summary=await loadJson('/api/me/message-notification-summary');
      const unread=summary.ok?Number(summary.body.unreadCount||0):0;
      unreadEl.textContent=summary.ok?String(unread):'—';
      const previews=summary.ok&&Array.isArray(summary.body.previews)?summary.body.previews:[];
      const inbox=await loadJson('/api/me/notifications');
      const alerts=inbox.ok&&Array.isArray(inbox.body.notifications)?inbox.body.notifications:[];
      alertEl.textContent=inbox.ok?String(alerts.length):(inbox.status===404?'Unavailable':'0');
      if(!token()){
        setStatus('Sign in on Profile to load your inbox.','muted');
      }else if(!summary.ok && !inbox.ok){
        setStatus('Could not load notifications.','error');
      }else{
        setStatus('Inbox ready','ok');
      }
      for(const preview of previews.slice(0,8)){
        listEl.append(card(preview.title||preview.teamName||'Message', preview.body||preview.preview||'Unread conversation','/messages'));
      }
      for(const item of alerts.slice(0,12)){
        listEl.append(card(item.title||'Alert', item.body||'', item.href||''));
      }
      emptyEl.hidden=listEl.childElementCount>0;
      if(!token()) emptyEl.textContent='Sign in to see personal alerts.';
      else if(inbox.status===404) emptyEl.textContent='Message unread counts load here. Full alert history is not on this lane yet.';
    }
    boot().catch((error)=>setStatus(error.message||'Could not load notifications','error'));
  </script>
</body>
</html>`;
}
