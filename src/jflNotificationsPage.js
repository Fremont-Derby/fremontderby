export function renderJflNotificationsPage() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notices · Fremont Derby</title>
<style>
  .notices{box-sizing:border-box;width:min(760px,100%);margin:auto;padding:20px 16px 80px;font:16px/1.5 system-ui,sans-serif}
  .notices h1{margin:0 0 4px}.notices p{margin:0 0 16px}
  .notice-actions{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
  .notice-actions button,.notice-actions a,.notice-card button,.notice-card a{display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border-radius:9px}
  .notice-list{display:grid;gap:12px}.notice-card{min-width:0;overflow-wrap:anywhere;padding:16px;border:1px solid #b6c5bb;border-radius:12px;background:#fff;color:#143023}
  .notice-card[data-unread="true"]{border-left:6px solid #24794b}.notice-card h2{margin:0 0 6px;font-size:1.06rem}
  .notice-card time,.notice-state{display:block;color:#46594e;font-size:.88rem}.notice-card p{margin:8px 0}
  .notice-card .notice-actions{margin:8px 0 0}.notice-status[role="status"]{min-height:24px}
  button:focus-visible,a:focus-visible{outline:3px solid #235d3e;outline-offset:3px}
  @media(max-width:600px){.notice-actions{flex-direction:column}.notice-actions>*{justify-content:center}}
</style></head><body>
<main class="notices"><h1>Notices</h1><p>League updates and actions for your player account. Conversations stay in <a href="/messages">Messages</a>.</p>
  <div class="notice-actions"><button type="button" data-mark-all disabled>Mark all read</button><button type="button" data-reload-notices>Reload notices</button><a href="/schedule">Schedule</a></div>
  <div class="notice-status" role="status" aria-live="polite" data-status>Loading notices…</div>
  <section class="notice-list" aria-label="Your notices" data-list></section>
</main>
<script>
(() => {
  const list = document.querySelector('[data-list]');
  const status = document.querySelector('[data-status]');
  const markAll = document.querySelector('[data-mark-all]');
  const reload = document.querySelector('[data-reload-notices]');
  let pending = false;
  function token(){ return sessionStorage.getItem('fd.accessToken') || ''; }
  async function api(path, method='GET') {
    const headers = { accept:'application/json' };
    if (token()) headers.authorization = 'Bearer ' + token();
    const response = await fetch(path,{method,headers});
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 ? 'Sign in on Profile to see your notices.' : (body.error || 'Notices could not be loaded.'));
    return body;
  }
  function safeHref(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\\\')) return null;
    const path = value.split(/[?#]/,1)[0];
    if (path === '/trades' || path === '/trade' || path.startsWith('/api/')) return null;
    return value;
  }
  function noticeCard(item) {
    const card = document.createElement('article'); card.className='notice-card'; card.dataset.unread=String(!item.readAt);
    const title=document.createElement('h2'); title.textContent=item.title || 'League notice'; card.append(title);
    if(item.kind){const source=document.createElement('span');source.className='notice-state';source.textContent=String(item.kind).replaceAll('_',' ');card.append(source)}
    const state=document.createElement('span'); state.className='notice-state'; state.textContent=item.readAt ? 'Read' : 'Unread'; card.append(state);
    const time=document.createElement('time'); const date=new Date(item.createdAt); if(!Number.isNaN(date.getTime())){time.dateTime=date.toISOString();time.textContent=date.toLocaleString();card.append(time)}
    if(item.body){const body=document.createElement('p');body.textContent=item.body;card.append(body)}
    const actions=document.createElement('div');actions.className='notice-actions';
    const href=safeHref(item.href);if(href){const link=document.createElement('a');link.href=href;link.textContent='Open related page';actions.append(link)}
    if(!item.readAt){const button=document.createElement('button');button.type='button';button.textContent='Mark read';button.addEventListener('click',()=>markRead('/api/me/notifications/'+encodeURIComponent(item.id)+'/read','Notice marked read.',item.id));actions.append(button)}
    card.append(actions);return card;
  }
  function beginOperation(){
    if(pending) return false;
    pending=true;markAll.disabled=true;reload.disabled=true;
    for(const button of list.querySelectorAll('button')) button.disabled=true;
    return true;
  }
  function profileRecovery(){const link=document.createElement('a');link.href='/profile';link.textContent='Open Profile';list.append(link)}
  async function load(savedMessage=''){
    if(!beginOperation()) return;
    list.replaceChildren();
    status.textContent='Loading notices…';
    try{
      const body=await api('/api/me/notifications');
      if(!Array.isArray(body?.notifications)) throw new Error('Notices could not be loaded. Reload notices to try again.');
      const items=body.notifications;
      items.sort((a,b)=>Number(Boolean(!b.readAt))-Number(Boolean(!a.readAt)) || Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
      list.replaceChildren(...items.map(noticeCard));
      if(!items.length){const empty=document.createElement('p');empty.textContent='No notices yet. League updates and team alerts will appear here.';list.append(empty)}
      const unread=items.filter(item=>!item.readAt).length;
      status.textContent=unread ? unread+' unread notice'+(unread===1?'':'s') : 'Up to date';
      markAll.disabled=unread===0;
    }catch(error){list.replaceChildren();status.textContent=savedMessage?savedMessage+' Current notices could not be reloaded: '+error.message+' Use Reload notices to check current state.':error.message;markAll.disabled=true;profileRecovery()}
    finally{pending=false;reload.disabled=false}
  }
  async function markRead(path,savedMessage,noticeId){
    if(!beginOperation()) return;
    status.textContent='Saving read state…';
    let confirmed=false;
    try{
      const body=await api(path,'POST');
      const valid=noticeId ? body?.notification?.id===noticeId&&typeof body.notification.readAt==='string'&&!Number.isNaN(Date.parse(body.notification.readAt)) : Number.isInteger(body?.updated)&&body.updated>=0;
      if(!valid) throw new Error('The read update was not confirmed.');
      confirmed=true;
    }
    catch(error){list.replaceChildren();status.textContent='Read state could not be confirmed: '+error.message+' Reload notices to check current state.';profileRecovery()}
    finally{pending=false;reload.disabled=false}
    if(confirmed) await load(savedMessage);
  }
  markAll.addEventListener('click',()=>markRead('/api/me/notifications/read-all','Notices marked read.'));
  reload.addEventListener('click',()=>load());
  load();
})();
</script></body></html>`;
}
