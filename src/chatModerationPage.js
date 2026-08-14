function safeJson(value) {
  return JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
}

export function renderChatModerationPage(env = {}) {
  const config = safeJson({
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Chat moderation · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#07150f;color:#f4f7f5;--panel:#0b2418;--line:#315d45;--muted:#afc1b6;--green:#39b979;--gold:#e9bd45;--danger:#d95d53}*{box-sizing:border-box}button,a,summary,select{touch-action:manipulation;-webkit-tap-highlight-color:transparent}input,select,textarea{font-size:16px}body{margin:0;min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% 0,#123b28,#07150f 34rem)}button,textarea{font:inherit}.app{width:min(900px,100%);margin:auto;padding:18px 16px 32px}.head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:16px}.head h1{margin:0;font-size:clamp(1.8rem,7vw,2.8rem)}a{color:#c8f0d8;font-weight:850}.status{padding:11px 13px;border:1px solid var(--line);border-radius:11px;background:#0a1c13;color:var(--muted);margin-bottom:12px}.status[data-tone="error"]{border-color:#88473f;color:#ffb3ac}.list{display:grid;gap:12px}.report{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.report[data-open="true"]{border-left:5px solid var(--gold)}.meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:var(--muted);font-size:.8rem}.context{margin:7px 0;font-weight:950}.message{margin:10px 0;padding:12px;border-radius:10px;background:#071b12;white-space:pre-wrap;overflow-wrap:anywhere}.reason{color:#f2d987;font-weight:850}.details{margin-top:5px;color:#d1ddd5}.actions{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,auto);gap:8px;margin-top:12px}.actions textarea{min-height:44px;padding:10px;border:1px solid var(--line);border-radius:9px;background:#06110d;color:#f4f7f5;resize:vertical}.actions button{min-height:44px;padding:0 12px;border:1px solid var(--line);border-radius:9px;background:#173b2a;color:#f4f7f5;font-weight:850;cursor:pointer}.actions .remove{border-color:#a94940;background:#7e332d}.actions .dismiss{background:transparent}.empty{padding:28px;text-align:center;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}@media(max-width:700px){.app{padding:12px 10px 24px}.head{display:grid;align-items:start}.actions{grid-template-columns:1fr 1fr}.actions textarea{grid-column:1/-1}.actions .remove{grid-column:1/-1}}
  </style>
</head>
<body>
  <main class="app">
    <header class="head"><div><h1>Chat moderation</h1><div style="color:var(--muted)">Review player reports across every chat type.</div></div><a href="/messages">Back to messages</a></header>
    <div class="status" data-status>Loading reports…</div>
    <section class="list" data-report-list aria-live="polite"></section>
  </main>
  <script>
    const config=${config};
    const statusEl=document.querySelector('[data-status]');const listEl=document.querySelector('[data-report-list]');
    function token(){return sessionStorage.getItem('fd.accessToken')||''}function refreshToken(){return sessionStorage.getItem('fd.refreshToken')||''}
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}
    async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
    async function refreshSession(){if(!config.supabaseUrl||!config.supabasePublishableKey||!refreshToken())return false;const response=await fetch(config.supabaseUrl.replace(/\\\/+$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.supabasePublishableKey,'content-type':'application/json'},body:JSON.stringify({refresh_token:refreshToken()})});if(!response.ok)return false;const body=await parseJson(response);if(!body.access_token)return false;sessionStorage.setItem('fd.accessToken',body.access_token);if(body.refresh_token)sessionStorage.setItem('fd.refreshToken',body.refresh_token);return true}
    async function api(path,options={},retry=true){if(!token())throw new Error('Sign in is required');const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json'}});if(response.status===401&&retry&&await refreshSession())return api(path,options,false);const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body}
    function formatTime(value){const date=new Date(value);return Number.isNaN(date.valueOf())?'':new Intl.DateTimeFormat([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date)}
    function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!=null)element.textContent=text;return element}
    function renderReports(reports){listEl.replaceChildren();if(!reports.length){listEl.append(node('div','empty','No chat reports to review.'));return}for(const report of reports){const card=node('article','report');const isOpen=report.status==='open'||report.status==='reviewing';card.dataset.open=String(isOpen);card.dataset.reportId=report.report_id;const meta=node('div','meta');meta.append(node('span','',report.target_type+' · '+report.status),node('time','',formatTime(report.created_at)));card.append(meta,node('div','context',report.context_label||'Chat message'),node('div','',report.author_display_name+' · reported by '+report.reporter_display_name),node('div','message',report.message_body||'Message already removed'));const reason=node('div','reason','Reason: '+report.reason);card.append(reason);if(report.details)card.append(node('div','details',report.details));if(isOpen){const actions=node('div','actions');const note=node('textarea');note.dataset.note='';note.maxLength=2000;note.placeholder='Moderation note (optional)';for(const [action,label,className] of [['keep','Resolve · keep',''],['dismiss','Dismiss','dismiss'],['remove','Remove message','remove']]){const button=node('button',className,label);button.type='button';button.dataset.action=action;actions.append(button)}actions.prepend(note);card.append(actions)}listEl.append(card)}}
    async function load(){if(!token()){setStatus('Sign in with a league admin account.','error');listEl.replaceChildren(node('a','','Open Profile'));listEl.firstChild.href='/profile';return}try{const body=await api('/api/admin/chat-reports?limit=100');const reports=Array.isArray(body.reports)?body.reports:[];renderReports(reports);setStatus(reports.filter(report=>report.status==='open'||report.status==='reviewing').length+' open report(s)')}catch(error){setStatus(error.message,'error');listEl.replaceChildren(node('div','empty','This page is available to league admins only.'))}}
    async function moderate(card,action){const reportId=card.dataset.reportId;const removeMessage=action==='remove';if(removeMessage&&!window.confirm('Remove this message for all participants and resolve the report?'))return;const resolution=action==='dismiss'?'dismissed':'resolved';const note=card.querySelector('[data-note]').value;setStatus('Saving moderation decision…');await api('/api/admin/chat-reports/'+encodeURIComponent(reportId)+'/resolve',{method:'POST',body:JSON.stringify({resolution,note,removeMessage})});await load();setStatus(removeMessage?'Message removed and report resolved':(resolution==='dismissed'?'Report dismissed':'Report resolved'),'ok')}
    listEl.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const card=button.closest('[data-report-id]');moderate(card,button.dataset.action).catch(error=>setStatus(error.message,'error'))});load();
  </script>
</body>
</html>`;
}
