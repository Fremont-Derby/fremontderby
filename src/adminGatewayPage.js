export function renderAdminGatewayPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0d1511;color:#f4f7f5;--panel:#142019;--line:#315d45;--muted:#a9bcb1;--green:#43bd7d;--gold:#e5bd50;--focus:#a9e6bf}
    *{box-sizing:border-box}input,select,textarea{font-size:16px}button,a,summary,.letter-index button,.action{touch-action:manipulation;-webkit-tap-highlight-color:transparent}[hidden]{display:none!important}body{margin:0;min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 85% 8%,rgba(229,189,80,.10),transparent 28%),linear-gradient(180deg,#0b1711,#101713 46%,#0c1210)}button{font:inherit;cursor:pointer}
    .app{width:min(920px,100%);margin:0 auto;padding:20px 16px 96px}.hero{padding:22px 0 18px;border-bottom:1px solid var(--line)}.kicker{color:#9fe0b9;font-size:.72rem;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.hero h1{margin:6px 0 7px;font-size:clamp(1.8rem,6vw,2.7rem);line-height:1}.hero p{max-width:620px;margin:0;color:var(--muted);line-height:1.5}.state{margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:14px;background:rgba(20,32,25,.92);box-shadow:0 14px 32px rgba(0,0,0,.18)}.state strong{display:block;font-size:1rem}.state p{margin:5px 0 0;color:var(--muted);line-height:1.45}.state[data-tone="error"]{border-color:#a94d46}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.card{min-height:132px;display:flex;flex-direction:column;gap:7px;padding:16px;border:1px solid var(--line);border-top:4px solid var(--accent,var(--green));border-radius:14px;background:linear-gradient(145deg,rgba(67,189,125,.08),rgba(20,32,25,.98) 58%);color:#f4f7f5;text-decoration:none;box-shadow:0 12px 28px rgba(0,0,0,.15)}.card[data-accent="gold"]{--accent:var(--gold)}.card[data-accent="blue"]{--accent:#78c9ff}.card[data-accent="rose"]{--accent:#ff9f9a}.card strong{font-size:1.04rem}.card span{color:var(--muted);font-size:.84rem;line-height:1.4}.card b{margin-top:auto;color:var(--accent);font-size:.82rem}.card:hover{transform:translateY(-1px)}.card:focus-visible,.action:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.action{min-height:48px;display:inline-flex;align-items:center;justify-content:center;margin-top:14px;padding:0 16px;border:1px solid var(--green);border-radius:10px;background:var(--green);color:#06120d;text-decoration:none;font-weight:950}.action.secondary{background:transparent;color:#f4f7f5;border-color:var(--line)}.recovery-actions{display:flex;gap:10px;flex-wrap:wrap}.support{display:grid;gap:10px}.support .action{margin-top:0}.status{min-height:24px;margin-top:12px;color:var(--muted);font-size:.84rem}.status[data-tone="error"]{color:#ffb9b3}
    @media(max-width:620px){.app{padding:14px 12px 92px}.hero{padding-top:12px}.grid{grid-template-columns:1fr}.card{min-height:112px}.state{padding:14px}.recovery-actions{display:grid;grid-template-columns:1fr}.recovery-actions .action{width:100%}}
    @media(prefers-reduced-motion:reduce){.card{transition:none}.card:hover{transform:none}}
  </style>
</head>
<body>
  <main class="app">
    <section class="hero" aria-labelledby="admin-title">
      <div class="kicker">Fremont Derby</div>
      <h1 id="admin-title">Admin</h1>
      <p>Choose the league task you need. Only tools you can use will appear.</p>
    </section>

    <section class="state" data-loading role="status" aria-live="polite" aria-atomic="true">
      <strong>Loading…</strong>
      <p>Preparing admin tools.</p>
    </section>

    <section data-admin-content hidden aria-labelledby="admin-tools-title">
      <h2 id="admin-tools-title" style="font-size:1rem;margin:18px 0 0">League tools</h2>
      <div class="grid">
        <a class="card" href="/admin/operations">
          <strong>Operations</strong><span>See what needs attention before league night.</span><b>Open operations →</b>
        </a>
        <a class="card" data-accent="blue" href="/admin/players">
          <strong>Players</strong><span>Search players A–Z, manage access, eligibility, and roster exceptions.</span><b>Manage players →</b>
        </a>
        <a class="card" data-accent="gold" href="/admin/seasons">
          <strong>Seasons</strong><span>Search seasons by name, letter, or status — then open setup or teams.</span><b>Browse seasons →</b>
        </a>
        <a class="card" href="/admin/season-teams">
          <strong>Season teams</strong><span>Jump team names A–Z and manage roster slots for a season.</span><b>Manage teams →</b>
        </a>
        <a class="card" href="/season-setup">
          <strong>League setup</strong><span>Create and publish seasons, capacity, and schedule.</span><b>Open setup →</b>
        </a>
        <a class="card" href="/admin/audit">
          <strong>Audit log</strong><span>Who changed rosters, scores, moderation, and broadcasts.</span><b>Open audit log →</b>
        </a>
        <a class="card" data-accent="rose" href="/messages/moderation">
          <strong>Moderation</strong><span>Review reported messages that need an admin decision.</span><b>Review reports →</b>
        </a>
      </div>
    </section>

    <section class="state support" data-player-content hidden>
      <strong>Need help from a league admin?</strong>
      <p>Admin support is being consolidated into Messages. For now, open Messages to contact someone you already coordinate with.</p>
      <a class="action" href="/messages">Open messages</a>
    </section>

    <section class="state" data-signed-out hidden>
      <strong>Sign in to continue</strong>
      <p>Admin tools and league help are tied to your Fremont Derby account.</p>
      <a class="action" href="/profile">Sign in on Profile</a>
    </section>

    <section class="state" data-access-error data-tone="error" role="alert" aria-live="assertive" aria-atomic="true" hidden>
      <strong>Couldn’t verify admin access</strong>
      <p>We could not confirm your admin access right now. No league data was changed.</p>
      <div class="recovery-actions">
        <button class="action" data-retry type="button">Try again</button>
        <a class="action secondary" href="/profile">Open Profile</a>
      </div>
    </section>

    <div class="status" data-status role="status" aria-live="polite" aria-atomic="true"></div>
  </main>
  <script>
    const loading=document.querySelector('[data-loading]');
    const adminContent=document.querySelector('[data-admin-content]');
    const playerContent=document.querySelector('[data-player-content]');
    const signedOut=document.querySelector('[data-signed-out]');
    const accessError=document.querySelector('[data-access-error]');
    const retryButton=document.querySelector('[data-retry]');
    const status=document.querySelector('[data-status]');
    const token=()=>sessionStorage.getItem('fd.accessToken')||'';

    function show(target){
      loading.hidden=true;adminContent.hidden=true;playerContent.hidden=true;signedOut.hidden=true;accessError.hidden=true;
      target.hidden=false;
    }

    function showLoading(){
      show(loading);
      status.textContent='';
      delete status.dataset.tone;
    }

    async function resolveAccess(){
      const accessToken=token();
      if(!accessToken){show(signedOut);return;}
      showLoading();
      try{
        const response=await fetch('/api/admin/players',{headers:{authorization:'Bearer '+accessToken}});
        if(response.ok){show(adminContent);return;}
        if(response.status===401){sessionStorage.removeItem('fd.accessToken');show(signedOut);status.textContent='Your sign-in may have expired.';return;}
        if(response.status===403){show(playerContent);return;}
        throw new Error('access check failed');
      }catch{
        show(accessError);
      }
    }

    retryButton.addEventListener('click',resolveAccess);
    resolveAccess();
  </script>
</body>
</html>`;
}
