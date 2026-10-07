function privacy(channel, label) {
const card = `<article class="panel" data-social-${channel}-consent>
  <div class="panel-head">Messaging privacy</div>
  <form style="display:grid;gap:12px;padding:12px" data-social-${channel}-consent-form>
    <label style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-social-${channel}-consent-toggle disabled style="width:24px;height:24px" /> Allow ${label}</label>
    <p>${label} is off until you choose to enable it. Turning it off stops participation and new messages in this channel, including from an already open chat.</p>
    <p>Your schedule, lineup, scoring and required league notices remain available with social chat off. Each messaging channel has its own setting.</p>
    <button class="primary" type="submit" data-social-${channel}-consent-save disabled>Save messaging privacy</button>
    <button type="button" data-social-${channel}-consent-reload>Reload messaging privacy</button>
    <div role="status" aria-live="polite" data-social-${channel}-consent-status>Sign in to load messaging privacy.</div>
  </form>
</article>`;

const script = `<script data-social-${channel}-consent-script>
(() => {
  const root=document.querySelector('[data-social-${channel}-consent]');if(!root)return;
  const toggle=root.querySelector('[data-social-${channel}-consent-toggle]'),save=root.querySelector('[data-social-${channel}-consent-save]'),reload=root.querySelector('[data-social-${channel}-consent-reload]'),status=root.querySelector('[data-social-${channel}-consent-status]');
  let generation=0,lastToken='',loaded=false,busy=false;
  const token=()=>sessionStorage.getItem('fd.accessToken')||'';
  const controls=()=>{toggle.disabled=busy||!loaded;save.disabled=busy||!loaded;reload.disabled=busy||!token()};
  async function request(method,value){
    const current=token(),id=++generation;loaded=false;busy=true;controls();status.textContent=method==='PUT'?'Saving messaging privacy…':'Loading messaging privacy…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('/api/me/social-chat-consent/${channel}',{method,headers:{authorization:'Bearer '+current,'content-type':'application/json'},signal:controller.signal,...(method==='PUT'?{body:JSON.stringify({enabled:value})}:{})});
      const body=await response.json();if(id!==generation||current!==token())return;
      if(!response.ok||typeof body.enabled!=='boolean')throw new Error('Could not confirm messaging privacy. Reload to try again.');
      toggle.checked=body.enabled;loaded=true;status.textContent=body.enabled?'${label} is ON.':'${label} is OFF.';
    }catch(error){if(id===generation&&current===token()){toggle.checked=false;status.textContent='Could not confirm messaging privacy. Reload to try again.';}}
    finally{clearTimeout(timer);if(id===generation){busy=false;controls();}}
  }
  function sync(){const current=token();if(current===lastToken)return;lastToken=current;++generation;loaded=false;busy=false;toggle.checked=false;controls();if(current)request('GET');else status.textContent='Sign in to load messaging privacy.';}
  root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(loaded&&!busy)request('PUT',toggle.checked)});
  reload.addEventListener('click',()=>{if(!busy&&token())request('GET')});
  window.addEventListener('storage',sync);window.addEventListener('fd:session-changed',sync);
  const state=document.querySelector('[data-session-state]');if(state)new MutationObserver(sync).observe(state,{childList:true,characterData:true,subtree:true});
  setTimeout(sync,0);
})();
</script>`;

return { card, script };
}

export async function enhanceProfileSocialChatConsent(response) {
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (html.includes(target) && !html.includes('data-social-general-consent-form')) {
    const sections = [privacy('general', 'General Chat'), privacy('team', 'Team Chat')];
    html = html.replace(target, target + sections.map(section => section.card).join(''))
      .replace('</body>', sections.map(section => section.script).join('') + '</body>');
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
}

