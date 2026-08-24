const style = `<style data-profile-contact-style>
  .profile-contact{display:grid;gap:12px;padding:12px}.profile-contact-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.profile-contact-note{color:var(--muted);font-size:.82rem;line-height:1.45}.profile-contact-state{font-size:.82rem;font-weight:900;color:#315443}.profile-contact-state[data-ready="true"]{color:#17663e}.profile-contact-state[data-tone="error"]{color:#8c1710}.profile-contact-error{color:#8c1710;font-weight:850;line-height:1.4}.profile-contact button{min-height:48px;padding:0 16px}.profile-contact [hidden]{display:none!important}@media(max-width:600px){.profile-contact-row{grid-template-columns:1fr}.profile-contact button{width:100%}}
</style>`;

const card = `<article class="panel" data-profile-contact>
  <div class="panel-head"><span>Private contact</span><span class="badge" data-contact-badge>Checking…</span></div>
  <form class="profile-contact" data-contact-form>
    <div class="profile-contact-row">
      <label>Phone number
        <input type="tel" inputmode="tel" autocomplete="tel" data-contact-phone placeholder="(206) 555-0123" aria-describedby="contact-privacy" />
      </label>
      <button class="primary" data-contact-save type="submit">Save phone</button>
    </div>
    <div class="profile-contact-state" data-contact-state></div>
    <div class="profile-contact-note" id="contact-privacy">Your phone number is private league-administration contact information. Other players do not get access to it. A phone number is required before you can serve as an active team captain.</div>
    <div class="profile-contact-error" role="status" aria-live="polite" data-contact-error hidden></div>
  </form>
</article>`;

const script = `<script data-profile-contact-script>
(() => {
  const root=document.querySelector('[data-profile-contact]');if(!root)return;
  const form=root.querySelector('[data-contact-form]');const phone=root.querySelector('[data-contact-phone]');const save=root.querySelector('[data-contact-save]');const badge=root.querySelector('[data-contact-badge]');const state=root.querySelector('[data-contact-state]');const errorEl=root.querySelector('[data-contact-error]');
  let lastContact=null;
  function token(){return sessionStorage.getItem('fd.accessToken')||''}
  function digits(value){return String(value||'').replace(/\\D/g,'')}
  function formatPhone(value){const raw=digits(value);if(raw.length===10)return '('+raw.slice(0,3)+') '+raw.slice(3,6)+'-'+raw.slice(6);if(raw.length===11&&raw.startsWith('1'))return '+1 ('+raw.slice(1,4)+') '+raw.slice(4,7)+'-'+raw.slice(7);return raw}
  async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
  async function request(options={},retry=true){const accessToken=token();if(!accessToken)throw new Error('Sign in to manage your contact information.');const response=await fetch('/api/me/contact',{...options,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json'}});if(response.status===401&&retry){await new Promise(resolve=>setTimeout(resolve,250));const refreshed=token();if(refreshed&&refreshed!==accessToken)return request(options,false)}const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body}
  function render(contact){lastContact=contact||null;const ready=Boolean(contact?.hasPhone);phone.value=formatPhone(contact?.phone||'');badge.textContent=ready?'Contact on file':'Phone missing';badge.dataset.tone=ready?'ok':'muted';state.hidden=false;state.dataset.ready=String(ready);state.dataset.tone=ready?'ok':'muted';state.textContent=ready?'Phone saved for league administration.':'No phone is on file. Normal player features still work; active captaincy requires a phone.';errorEl.hidden=true;errorEl.textContent=''}
  function showError(error){errorEl.hidden=false;errorEl.textContent=error?.message||'We could not update your phone number. Nothing was changed.';badge.textContent='Fix phone';badge.dataset.tone='error';state.hidden=false;state.dataset.ready='false';state.dataset.tone='error';state.textContent=lastContact?.hasPhone?'Saved phone was not changed.':'Nothing was saved.'}
  async function load(){badge.textContent='Checking…';badge.dataset.tone='loading';const body=await request({method:'GET'});render(body.contact)}
  async function savePhone(){save.disabled=true;save.textContent='Saving…';badge.textContent='Saving…';badge.dataset.tone='loading';errorEl.hidden=true;try{const raw=digits(phone.value);const body=await request({method:'PUT',body:JSON.stringify({phone:raw||null})});render(body.contact)}finally{save.disabled=false;save.textContent='Save phone'}}
  phone.addEventListener('input',()=>{phone.value=formatPhone(phone.value);if(!errorEl.hidden){errorEl.hidden=true;badge.textContent=lastContact?.hasPhone?'Contact on file':'Phone missing';badge.dataset.tone=lastContact?.hasPhone?'ok':'muted';state.dataset.tone=lastContact?.hasPhone?'ok':'muted';state.textContent=lastContact?.hasPhone?'Phone saved for league administration.':'No phone is on file.'}});
  phone.addEventListener('blur',()=>{phone.value=formatPhone(phone.value)});
  form.addEventListener('submit',event=>{event.preventDefault();savePhone().catch(showError)});
  setTimeout(()=>{if(token())load().catch(showError)},0);
})();
</script>`;

export async function enhanceProfileContact(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (!html.includes(target) || html.includes('data-profile-contact')) return new Response(html, response);
  html = html
    .replace('</head>', `${style}</head>`)
    .replace(target, `${target}${card}`)
    .replace('</body>', `${script}</body>`);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
