const fixture = {
  team: 'Break Room Bandits',
  opponent: 'Golden Rail',
  roster: [
    { id: 'maya', name: 'Maya Example', rating: 525, status: 'available', type: 'roster' },
    { id: 'theo', name: 'Theo Example', rating: 505, status: 'unsure', type: 'roster' },
    { id: 'alex', name: 'Alex Example', rating: 480, status: 'unavailable', type: 'roster' },
    { id: 'jamie', name: 'Jamie Example', rating: 495, status: 'available', type: 'free-agent' },
  ],
  opponentLineup: [
    { name: 'Eli Example', rating: 475 },
    { name: 'Dana Example', rating: 500 },
    { name: 'Owen Example', rating: 515 },
  ],
};

export function renderCaptainSandboxPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <title>Season 1 War Games · Captain · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#101313;color:#f6f1e7;--panel:#1b1f1e;--line:#38413e;--muted:#aeb8b3;--green:#2fa972;--gold:#d8ad3f;--red:#d45b50}*{box-sizing:border-box}body{margin:0;background:#101313}.app{width:min(980px,100%);margin:auto;padding:14px}.sandbox{position:sticky;top:58px;z-index:5;padding:9px 12px;background:#5a4100;color:#fff4cf;border:1px solid #94711b;border-radius:8px;font-weight:900}.top{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 0}.muted{color:var(--muted)}a{color:#a9d8bc}.panel{border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:12px;margin-bottom:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.player,.slot,.match{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.player:last-child,.slot:last-child,.match:last-child{border-bottom:0}.status{font-size:.78rem;font-weight:850;text-transform:uppercase}.available{color:#9ee5bd}.unsure{color:#f5d68a}.unavailable{color:#ffb1aa}.free{color:#a8cbff}select,button,.continue{min-height:46px;border-radius:8px;border:1px solid var(--line);font:inherit}select{width:100%;background:#111615;color:#fff;padding:0 10px}button{font-weight:850;cursor:pointer}.primary{background:var(--green);color:#06120d}.ghost{background:transparent;color:#fff}.danger{background:var(--red);color:#180504}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.notice{padding:10px;border-radius:8px;background:#151a18;border:1px solid var(--line)}.ok{border-color:var(--green)}.warn{border-color:var(--gold)}.quick{border-color:#94711b;background:#241d0d}.continue{display:flex;align-items:center;justify-content:center;margin-top:12px;padding:10px 14px;background:var(--gold);border-color:var(--gold);color:#17120a;text-decoration:none;font-weight:900}.continue[hidden]{display:none}button:disabled,select:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){.grid,.actions{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}.player{grid-template-columns:1fr}}
  </style>
</head>
<body><main class="app">
  <div class="sandbox">SEASON 1 WAR GAMES · THROWAWAY TEST DATA · NEVER AFFECTS LEAGUE RECORDS</div>
  <header class="top"><div><h1>1. Captain dry run</h1><div class="muted">The lineup is prefilled so you can submit immediately, or change availability and players first.</div></div><a href="/demo">War Games home</a></header>
  <section class="panel quick"><strong>No sign-in or setup required.</strong><div class="muted">Everything on this screen is fake and stored only in this browser tab.</div></section>
  <section class="grid">
    <article class="panel"><h2>Round availability</h2><div class="muted">Example roster for ${fixture.team}</div><div data-roster></div></article>
    <article class="panel"><h2>Three active players</h2><div class="muted">A valid starter lineup is already selected. Change it or just submit.</div><div data-slots></div><div class="actions"><button class="primary" data-submit>Submit lineup</button><button class="ghost" data-reset>Reset lineup</button></div></article>
  </section>
  <section class="panel notice" data-state><strong data-state-title></strong><div class="muted" data-state-detail></div></section>
  <section class="panel"><h2>Generated matchups</h2><div class="muted">Opponent lineup appears after your submission.</div><div data-matches></div><a class="continue" data-continue href="/sandbox/player" hidden>2. Score Match 1 →</a></section>
</main>
<script>
const fixture=${JSON.stringify(fixture)};const storageKey='fd.captainSandbox.v1';
function fresh(){return{availability:Object.fromEntries(fixture.roster.map(p=>[p.id,p.status])),slots:['maya','theo','jamie'],submitted:false}}
function load(){try{return JSON.parse(sessionStorage.getItem(storageKey))||fresh()}catch{return fresh()}}let state=load();
function save(){sessionStorage.setItem(storageKey,JSON.stringify(state))}
function eligible(){return fixture.roster.filter(p=>state.availability[p.id]!=='unavailable')}
function rosterHtml(){return fixture.roster.map(p=>'<div class="player"><div><strong>'+p.name+'</strong><div class="muted">'+p.rating+(p.type==='free-agent'?' · free agent':' · roster')+'</div></div><select data-availability="'+p.id+'"><option value="available" '+(state.availability[p.id]==='available'?'selected':'')+'>Available</option><option value="unsure" '+(state.availability[p.id]==='unsure'?'selected':'')+'>Unsure</option><option value="unavailable" '+(state.availability[p.id]==='unavailable'?'selected':'')+'>Unavailable</option></select></div>').join('')}
function slotHtml(index){const options=['<option value="">Select player</option>'].concat(eligible().map(p=>'<option value="'+p.id+'" '+(state.slots[index]===p.id?'selected':'')+'>'+p.name+(p.type==='free-agent'?' (free agent)':'')+'</option>'));return'<div class="slot"><strong>Slot '+(index+1)+'</strong><select data-slot="'+index+'">'+options.join('')+'</select></div>'}
function validation(){const picked=state.slots.filter(Boolean);if(picked.length!==3)return'Choose all three active players.';if(new Set(picked).size!==3)return'Each active slot must use a different player.';for(const id of picked){if(state.availability[id]==='unavailable')return'Unavailable players cannot be submitted.'}return''}
function matchupHtml(){if(!state.submitted)return'<div class="muted" style="padding:10px 0">Submit the lineup to generate all three player matches.</div>';return state.slots.map((id,i)=>{const ours=fixture.roster.find(p=>p.id===id),opp=fixture.opponentLineup[i];return'<div class="match"><div><strong>Match '+(i+1)+'</strong><div class="muted">'+ours.name+' ('+ours.rating+') vs '+opp.name+' ('+opp.rating+')</div></div><span class="status '+(ours.type==='free-agent'?'free':'available')+'">'+(ours.type==='free-agent'?'SUB':'READY')+'</span></div>'}).join('')}
function render(){document.querySelector('[data-roster]').innerHTML=rosterHtml();document.querySelector('[data-slots]').innerHTML=[0,1,2].map(slotHtml).join('');document.querySelector('[data-matches]').innerHTML=matchupHtml();const problem=validation(),box=document.querySelector('[data-state]'),title=document.querySelector('[data-state-title]'),detail=document.querySelector('[data-state-detail]');if(state.submitted){box.className='panel notice ok';title.textContent='Lineup submitted';detail.textContent='Three fictional matchups generated. Continue to Match 1 scoring below.'}else if(problem){box.className='panel notice warn';title.textContent='Lineup not ready';detail.textContent=problem}else{box.className='panel notice ok';title.textContent='Ready — one tap to submit';detail.textContent='All three slots are eligible and unique, including the example free-agent substitute.'}document.querySelector('[data-submit]').disabled=Boolean(problem)||state.submitted;document.querySelector('[data-continue]').hidden=!state.submitted;document.querySelectorAll('[data-availability]').forEach(el=>{el.disabled=state.submitted;el.onchange=()=>{state.availability[el.dataset.availability]=el.value;state.slots=state.slots.map(id=>state.availability[id]==='unavailable'?'':id);save();render()}});document.querySelectorAll('[data-slot]').forEach(el=>{el.disabled=state.submitted;el.onchange=()=>{state.slots[Number(el.dataset.slot)]=el.value;save();render()}})}
document.querySelector('[data-submit]').onclick=()=>{if(validation())return;state.submitted=true;save();render()};document.querySelector('[data-reset]').onclick=()=>{state=fresh();save();render()};render();
</script></body></html>`;
}
