const modernProfileStyle = `<style data-fd-modern-profile-style>
  :root{--fd-profile-green:#075f3a;--fd-profile-green-dark:#033c25;--fd-profile-ink:#151916;--fd-profile-muted:#4b554f;--fd-profile-line:#b9c3bc;--fd-profile-warm:#f5f2ea;--fd-profile-error:#8c1710;--fd-profile-disabled-bg:#c7d0ca;--fd-profile-disabled-ink:#1f2b24;--fd-profile-success-bg:#075f3a;--fd-profile-success-ink:#fff}
  body{background:var(--fd-profile-warm)!important;color:var(--fd-profile-ink)!important}
  .app{width:min(100% - 24px,920px)!important;margin:0 auto!important;padding:26px 0 calc(176px + env(safe-area-inset-bottom))!important}
  .topbar{display:grid!important;gap:8px!important;align-items:start!important;padding:24px!important;border:0!important;border-radius:22px!important;background:linear-gradient(145deg,var(--fd-profile-green-dark),var(--fd-profile-green))!important;color:#fff!important;box-shadow:0 8px 24px rgba(3,60,37,.18)!important}
  .brand{font-size:.78rem!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:#fff!important}.mark{display:none!important}.status{display:inline-flex!important;align-items:center!important;width:fit-content!important;min-height:32px!important;padding:5px 10px!important;border-radius:999px!important;text-align:left!important;background:#fff!important;color:var(--fd-profile-green-dark)!important;font-weight:850!important}.status[data-tone="error"]{background:#fff1ef!important;color:var(--fd-profile-error)!important}.status[data-tone="ok"]{background:#e8f5ed!important;color:#064d30!important}
  .grid{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding-top:14px!important}.panel{border:2px solid var(--fd-profile-line)!important;border-radius:18px!important;background:#fff!important;overflow:hidden!important;box-shadow:0 5px 16px rgba(0,0,0,.05)!important}.panel-head{min-height:52px!important;padding:0 16px!important;border-bottom:1px solid #d9dfda!important;background:#f8faf8!important;color:var(--fd-profile-ink)!important}.stack{gap:14px!important;padding:14px!important}
  [data-auth-form]{grid-template-columns:1fr!important}.hint{color:var(--fd-profile-muted)!important}.badge{background:#e5eee8!important;color:var(--fd-profile-green-dark)!important;border:1px solid #a9bcb0!important}.badge[data-tone="error"]{background:#fff1ef!important;color:var(--fd-profile-error)!important;border-color:#d8aaa6!important}.badge[data-tone="loading"]{background:#e4e9e5!important;color:#27332c!important;border-color:#89968e!important}.primary{background:var(--fd-profile-green)!important;color:#fff!important}.ghost{background:#fff!important;color:var(--fd-profile-green-dark)!important;border:2px solid #87978d!important}.danger{background:#fff!important;color:var(--fd-profile-error)!important;border:2px solid #bd7e78!important}.google{background:#fff!important;color:#202124!important;border:2px solid #9ea9a2!important;border-radius:12px!important}
  button:disabled{opacity:1!important;background:var(--fd-profile-disabled-bg)!important;color:var(--fd-profile-disabled-ink)!important;border-color:#7c8b82!important;cursor:not-allowed!important}.primary:disabled{background:var(--fd-profile-disabled-bg)!important;color:var(--fd-profile-disabled-ink)!important}.ghost:disabled,.danger:disabled{background:var(--fd-profile-disabled-bg)!important;color:var(--fd-profile-disabled-ink)!important;border-color:#7c8b82!important}[data-fd-modern-profile="true"] .primary,[data-fd-modern-profile="true"] .primary:hover,[data-fd-modern-profile="true"] .primary:focus-visible{background:var(--fd-profile-green)!important;color:#fff!important;border-color:var(--fd-profile-green-dark)!important}[data-fd-modern-profile="true"] .primary:active{background:var(--fd-profile-green-dark)!important;color:#fff!important;border-color:#021f13!important}body[data-fd-player-surface="profile"] [data-fd-modern-profile="true"] button:disabled,body[data-fd-player-surface="profile"] [data-fd-modern-profile="true"] .primary:disabled,body[data-fd-player-surface="profile"] [data-fd-modern-profile="true"] .ghost:disabled,body[data-fd-player-surface="profile"] [data-fd-modern-profile="true"] .danger:disabled{opacity:1!important;background:var(--fd-profile-disabled-bg)!important;color:var(--fd-profile-disabled-ink)!important;border-color:#7c8b82!important}[data-fd-modern-profile="true"] button:disabled *{color:inherit!important}[data-fd-modern-profile="true"] [data-fd-profile-status][data-tone="ok"]{background:var(--fd-profile-success-bg)!important;color:var(--fd-profile-success-ink)!important;-webkit-text-fill-color:#fff!important;border:1px solid #fff!important}
  [data-authenticated-content]{display:flex!important;flex-direction:column!important;padding:0!important;gap:14px!important}[data-authenticated-content][hidden]{display:none!important}
  [data-player-claim]{order:0}[data-profile-identity]{order:1;border:3px solid var(--fd-profile-green)!important;background:linear-gradient(145deg,#edf7f1,#fff 65%)!important}[data-season-now]{order:2}[data-profile-contact]{order:3}[data-profile-teams]{order:4}[data-profile-seasons]{order:5}[data-admin-tools]{order:6}
  [data-profile-identity] .panel-head{background:var(--fd-profile-green-dark)!important;color:#fff!important;border-bottom:0!important}[data-profile-identity] .badge{background:#fff!important;color:var(--fd-profile-green-dark)!important}.profile-head{grid-template-columns:minmax(0,1fr) auto!important;gap:16px!important}.profile-head h1{font-size:clamp(2rem,8vw,3.2rem)!important;letter-spacing:-.03em!important;color:var(--fd-profile-ink)!important}.rating{min-width:106px!important;min-height:82px!important;border-radius:16px!important;background:#e6efe9!important;color:var(--fd-profile-green-dark)!important;border:1px solid #a9bcb0!important}.actions{grid-template-columns:minmax(0,1fr) auto!important;align-items:end!important}.actions button{min-width:140px!important}
  input{background:#fff!important;color:var(--fd-profile-ink)!important;border:2px solid #8f9d94!important;border-radius:11px!important}label{color:#3f4943!important}.season-now,.profile-contact,.player-claim{padding:16px!important}.season-now-action,.profile-contact button,.player-claim button{border-radius:11px!important}.profile-contact-note{color:#505a54!important}.profile-contact-error,.season-now-error{color:var(--fd-profile-error)!important}.profile-contact-state[data-tone="error"]{color:var(--fd-profile-error)!important}.profile-contact-state[data-tone="loading"]{color:#27332c!important}
  table{background:#fff!important}th{color:#465049!important}th,td{border-bottom-color:#dbe0dc!important}.empty{color:var(--fd-profile-muted)!important}.empty a{color:var(--fd-profile-green)!important}.admin-tools{border-color:#bda958!important;background:#fffaf0!important}.admin-tools .panel-head{background:#fff4cf!important;color:#4b3900!important;border-bottom-color:#dbc77b!important}.admin-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}.admin-actions a{background:#fff!important;color:#5b4600!important;border:2px solid #bda958!important}
  button,a,input,summary{min-height:44px}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #0a7848!important;outline-offset:3px!important}
  @media(max-width:640px){.app{width:min(100% - 20px,920px)!important;padding-top:14px!important}.topbar{padding:18px!important;border-radius:18px!important}.profile-head{grid-template-columns:1fr!important}.rating{width:106px!important}.actions{grid-template-columns:1fr!important}.actions button{width:100%!important}.admin-actions{grid-template-columns:1fr!important}.panel-head{padding:0 14px!important}.stack{padding:14px!important}}
  @media(forced-colors:active){.panel,[data-profile-identity],button,input,a{border:2px solid CanvasText!important}.topbar,[data-profile-identity] .panel-head,.status{background:Canvas!important;color:CanvasText!important}}
</style>`;

const profileUiPolishScript = `<script data-fd-profile-ui-polish>
(() => {
  const form=document.querySelector('[data-profile-form]');
  const rating=document.querySelector('[data-rating]');
  const ratingStatus=document.querySelector('[data-rating-status]');
  if(!form||!rating||!ratingStatus)return;
  let savedRating='';
  let savedStatus='';
  let observer=null;
  form.addEventListener('submit',()=>{
    savedRating=rating.textContent||'';
    savedStatus=ratingStatus.textContent||'';
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>{
      if(savedRating&&savedRating!=='—'&&rating.textContent==='—')rating.textContent=savedRating;
      if(savedStatus&&savedStatus!=='Not rated'&&ratingStatus.textContent==='Not rated')ratingStatus.textContent=savedStatus;
    });
    observer.observe(rating,{childList:true,characterData:true,subtree:true});
    observer.observe(ratingStatus,{childList:true,characterData:true,subtree:true});
    setTimeout(()=>{observer?.disconnect();observer=null},2500);
  },true);
})();
</script>`;

export function modernizeJflProfileHtml(html = '') {
  if (!html || html.includes('data-fd-modern-profile="true"')) return html;
  let next = String(html);
  next = next.replace('<main class="app">', '<main class="app" data-fd-modern-profile="true">');
  next = next.replace(
    'data-status>Checking sign-in…</div>',
    'data-status data-fd-profile-status>Checking sign-in…</div>',
  );
  next = next.replace(
    '<article class="panel">\n          <div class="panel-head"><span>Profile</span>',
    '<article class="panel" data-profile-identity>\n          <div class="panel-head"><span>Your profile</span>',
  );
  next = next.replace(
    '<article class="panel admin-tools" data-admin-tools hidden>',
    '<article class="panel admin-tools" data-admin-tools data-admin-tools-card hidden>',
  );
  next = next.replace(
    '<article class="panel">\n          <div class="panel-head"><span>Teams</span>',
    '<article class="panel" data-profile-teams>\n          <div class="panel-head"><span>Teams</span>',
  );
  next = next.replace(
    '<article class="panel">\n          <div class="panel-head"><span>Seasons</span>',
    '<article class="panel" data-profile-seasons>\n          <div class="panel-head"><span>Seasons</span>',
  );
  next = next.replace('</head>', `${modernProfileStyle}</head>`);
  next = next.replace('</body>', `${profileUiPolishScript}</body>`);
  return next;
}

export async function enhanceJflModernProfile(response, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  const html = modernizeJflProfileHtml(await response.text());
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { modernProfileStyle as jflModernProfileStyles };
