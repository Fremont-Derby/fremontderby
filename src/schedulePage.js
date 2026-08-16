import { safeAutocompleteClientScript } from './safeAutocomplete.js';

export function renderSchedulePage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Schedule</title>
  <style>
    :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f3f1ed;color:#171b19;--panel:#ffffff;--line:#d7d9d7;--muted:#666b68;--green:#08733d;--gold:#e1b82f}
    *{box-sizing:border-box}input,select,textarea{font-size:16px}button,a,summary,select,input[type=button],input[type=submit]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}body{margin:0;min-height:100vh;min-height:100dvh;background:#f3f1ed}button,select{font:inherit}.app{width:min(980px,100%);margin:auto;padding:16px}.topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;font-weight:950}.mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%);color:#111;font-weight:950}.status{min-height:28px;color:var(--muted);text-align:right}.status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}.controls{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 0}label{display:grid;gap:6px;color:var(--muted);font-size:.78rem;font-weight:900}select{width:100%;min-height:48px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#171b19}.round{border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden}.round-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border-bottom:1px solid var(--line)}.kicker{color:#9ee5bd;font-size:.72rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.round-head h1{margin:3px 0 0;font-size:clamp(1.5rem,5vw,2.2rem)}.round-meta{color:var(--muted);font-size:.85rem;text-align:right}.matches{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}.match{content-visibility:auto;contain-intrinsic-size:120px;min-width:0;display:grid;gap:10px;padding:13px;border:1px solid var(--line);border-top:4px solid var(--gold);border-radius:11px;background:#fff}.match-top{display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:.75rem;font-weight:850}.versus{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center}.versus strong{overflow-wrap:anywhere;font-size:1rem}.versus strong:last-child{text-align:right}.versus span{color:var(--gold);font-size:.72rem;font-weight:950;text-transform:uppercase}.match-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}@media(max-width:520px){.match-actions{grid-template-columns:1fr}}.match-actions a{min-height:44px;display:grid;place-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;color:#f5f0e8;text-decoration:none;font-size:.8rem;font-weight:900}.match-actions a.primary{border-color:var(--green);background:var(--green);color:#06120d}.empty{padding:24px;color:var(--muted);text-align:center}.match[data-status="in_progress"]{border-top-color:#2fa972;box-shadow:inset 0 0 0 1px rgba(47,169,114,.28)}.match[data-status="finalized"],.match[data-status="corrected"]{opacity:.9}.status-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:950;text-transform:uppercase;letter-spacing:.04em;background:#343c45;color:#d7dee4}.status-pill[data-tone="live"]{background:#2fa972;color:#06140c}.status-pill[data-tone="tonight"]{background:#e9bd45;color:#1a1403}.status-pill[data-tone="done"]{background:#2a323a;color:#aab3bb}.round-head .kicker{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.empty a{color:#f0d48b}.round[hidden],.empty[hidden]{display:none}
    @media(max-width:700px){.app{padding:12px}.topbar{align-items:flex-start}.status{text-align:left}.controls,.matches{grid-template-columns:1fr}.round-head{align-items:flex-start}.round-meta{text-align:left}.match{min-height:152px}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar"><div class="brand"><span class="mark">9</span><span>Fremont Derby Schedule</span></div><div class="status" data-status>Loading…</div></header>
    <nav data-schedule-shortcuts aria-label="Related" style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 4px">
      <a href="/availability" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Check in</a>
      <a href="/lineup" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Lineup</a>
      <a href="/scorecard" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Score</a>
      <a href="/standings" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Standings</a>
      <a href="/trades" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Trades</a>
      <a href="/playoffs" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Playoffs</a>
      <a href="/messages" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Messages</a>
      <a href="/teams" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Teams</a>
    </nav>
    <section class="controls" aria-label="Schedule selection">
      <label>Season<select data-season-select disabled><option value="">Loading seasons…</option></select></label>
      <label>League night<select data-round-select disabled><option value="">Choose a season</option></select></label>
    </section>
    <section class="round" data-round-panel hidden>
      <div class="round-head">
        <div><span class="kicker" data-round-kicker>Next league night</span><h1 data-round-title>Round</h1></div>
        <div class="round-meta"><strong data-round-date>Date</strong><br /><span data-round-status>Status</span></div>
      </div>
      <div class="matches" data-match-list></div>
    </section>
    <div class="empty" data-empty hidden>No schedule has been published for this season yet. <a href="/standings">View standings</a> · <a href="/availability">Check in</a> · <a href="/teams">Teams</a> · <a href="/players">Players</a></div>
  </main>
  <script>
    const seasonSelect=document.querySelector('[data-season-select]');const roundSelect=document.querySelector('[data-round-select]');const statusEl=document.querySelector('[data-status]');const panel=document.querySelector('[data-round-panel]');const roundKicker=document.querySelector('[data-round-kicker]');const roundTitle=document.querySelector('[data-round-title]');const roundDate=document.querySelector('[data-round-date]');const roundStatus=document.querySelector('[data-round-status]');const matchList=document.querySelector('[data-match-list]');const emptyEl=document.querySelector('[data-empty]');const query=new URLSearchParams(location.search);const requestedSeason=query.get('season')||localStorage.getItem('fd.scheduleSeasonId')||'';const requestedRound=query.get('round')||localStorage.getItem('fd.scheduleRoundId')||'';let seasons=[];let rounds=[];
    function setStatus(message,tone,opts){if(window.fdSetStatus){window.fdSetStatus(statusEl,message,tone||'muted',opts||{});return}statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}async function json(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}async function get(path){if(window.fdConditionalFetch){const result=await window.fdConditionalFetch(path);if(result.notModified)return result.body?{...result.body,__notModified:true}:{__notModified:true};const body=result.body||{};if(!result.response.ok)throw new Error(body.error||'We could not load the schedule.');return body}const response=await fetch(path);const body=await json(response);if(!response.ok)throw new Error(body.error||'We could not load the schedule.');return body}function dateLabel(value){if(!value)return'Date TBD';const date=new Date(value+'T12:00:00');return new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(date)}function stageLabel(round){if(round.stage==='championship')return'Championship';if(round.stage==='semifinal')return'Semifinals';if(round.stage==='tiebreaker')return'Tiebreaker';return'Round '+round.roundNumber}function deadlineHint(value){if(!value)return'';const deadline=new Date(value);if(Number.isNaN(deadline.getTime()))return'';const ms=deadline.getTime()-Date.now();const hours=Math.round(Math.abs(ms)/3600000);if(ms<0)return'Lineups overdue';if(ms<=24*3600000)return'Lineups due in '+Math.max(1,hours)+'h';return'Lineups due '+deadline.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
    function statusLabel(value){const raw=String(value||'scheduled');if(raw==='in_progress')return'Live';if(raw==='finalized')return'Final';if(raw==='corrected')return'Corrected';if(raw==='scheduled')return'Scheduled';return raw.replaceAll('_',' ')}function statusTone(value){const raw=String(value||'');if(raw==='in_progress')return'live';if(raw==='finalized'||raw==='corrected')return'done';if(raw==='scheduled')return'tonight';return''}function preferredRound(){if(requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;const today=new Date().toISOString().slice(0,10);const now=Date.now();const seasonMeta=seasons.find((s)=>s.id===seasonSelect.value);const seasonComplete=seasonMeta&&String(seasonMeta.status||'')==='complete';// WHY: single O(rounds+matches) pass — avoid repeated filter/sort on every render.
let bestLive=null,bestLiveScore=-Infinity,bestUpcoming=null,bestUpcomingDistance=Infinity,bestFinal=null,bestFinalStage=-1;for(const round of rounds){const matches=round.matches||[];let hasLive=false,hasFinal=false;for(const match of matches){if(match.status==='in_progress')hasLive=true;if(match.status==='finalized'||match.status==='corrected')hasFinal=true}if(round.status==='finalized')hasFinal=true;const stage=round.stage==='championship'?4:round.stage==='semifinal'?3:round.stage==='tiebreaker'?2:1;const parsed=Date.parse(round.scheduledOn||'');const distance=Number.isFinite(parsed)?Math.abs(parsed-now):Number.MAX_SAFE_INTEGER;if(hasLive&&!seasonComplete){const score=stage*1e15-distance;if(score>bestLiveScore){bestLiveScore=score;bestLive=round.roundId}}if(seasonComplete&&hasFinal&&stage>=bestFinalStage){bestFinalStage=stage;bestFinal=round.roundId}if(!round.scheduledOn||round.scheduledOn>=today){if(distance<bestUpcomingDistance){bestUpcomingDistance=distance;bestUpcoming=round.roundId}}}if(bestLive)return bestLive;if(seasonComplete&&bestFinal)return bestFinal;return bestUpcoming||(rounds[rounds.length-1]||{}).roundId||''}
    function renderSeasons(){seasonSelect.replaceChildren();if(!seasons.length){const option=document.createElement('option');option.value='';option.textContent='No public seasons';seasonSelect.append(option);seasonSelect.disabled=true;roundSelect.disabled=true;emptyEl.hidden=false;panel.hidden=true;return}for(const season of seasons){const option=document.createElement('option');option.value=season.id;option.textContent=season.name+' · '+statusLabel(season.status);seasonSelect.append(option)}const current=seasons.find((season)=>['active','playoffs'].includes(season.status))||seasons[0];seasonSelect.value=requestedSeason&&seasons.some((season)=>season.id===requestedSeason)?requestedSeason:current.id;seasonSelect.disabled=false}
    function renderRoundOptions(){roundSelect.replaceChildren();if(!rounds.length){const option=document.createElement('option');option.value='';option.textContent='Schedule not published';roundSelect.append(option);roundSelect.disabled=true;panel.hidden=true;emptyEl.hidden=false;return}const todayKey=new Date().toISOString().slice(0,10);for(const round of rounds){const option=document.createElement('option');option.value=round.roundId;const live=(round.matches||[]).some((m)=>m.status==='in_progress');const tonight=round.scheduledOn===todayKey;const tag=live?' · Live':(tonight?' · Tonight':'');option.textContent=stageLabel(round)+' · '+dateLabel(round.scheduledOn)+tag;roundSelect.append(option)}roundSelect.value=preferredRound();roundSelect.disabled=false;emptyEl.hidden=true;renderRound()}

    function accessToken(){return sessionStorage.getItem('fd.accessToken')||''}
    async function authJson(path,options={}){
      const token=accessToken();
      if(!token)throw new Error('Sign in to manage makeup matches.');
      const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token,'content-type':'application/json',...(options.headers||{})}});
      const body=await json(response);
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    async function proposeMakeup(teamMatchId){
      const on=document.querySelector('[data-makeup-on="'+teamMatchId+'"]');
      const loc=document.querySelector('[data-makeup-location="'+teamMatchId+'"]');
      const makeupOn=on?on.value:'';
      const makeupLocation=loc?loc.value.trim():'';
      if(!makeupOn)throw new Error('Choose a makeup date');
      setStatus('Proposing makeup…');
      await authJson('/api/team-matches/'+encodeURIComponent(teamMatchId)+'/makeup',{method:'POST',body:JSON.stringify({makeupOn,makeupLocation})});
      await loadSchedule();
      setStatus('Makeup proposed — waiting on the other captain.','ok');
    }
    async function respondMakeup(teamMatchId,response){
      setStatus('Updating makeup…');
      await authJson('/api/team-matches/'+encodeURIComponent(teamMatchId)+'/makeup/respond',{method:'POST',body:JSON.stringify({response})});
      await loadSchedule();
      setStatus(response==='accepted'?'Makeup accepted.':'Makeup updated.','ok');
    }

    function renderRound(){const round=rounds.find((item)=>item.roundId===roundSelect.value);if(!round){panel.hidden=true;return}const today=new Date().toISOString().slice(0,10);roundKicker.textContent=round.scheduledOn===today?'Tonight':(round.scheduledOn&&round.scheduledOn>today?'Next league night':'League night');roundTitle.textContent=stageLabel(round);roundDate.textContent=(dateLabel(round.scheduledOn));const _dl=deadlineHint(round.lineupDeadlineAt||round.lineup_deadline_at);if(_dl)roundDate.textContent=String(roundDate.textContent||'')+(' · '+_dl);const matchStatuses=(round.matches||[]).map((m)=>m.status);let derivedStatus=round.status;if(matchStatuses.length){if(matchStatuses.every((s)=>s==='finalized'||s==='corrected'))derivedStatus='finalized';else if(matchStatuses.some((s)=>s==='in_progress'||s==='finalized'||s==='corrected'))derivedStatus='in_progress'}roundStatus.textContent=statusLabel(derivedStatus);roundStatus.className='status-pill';roundStatus.dataset.tone=statusTone(derivedStatus);if(window.fdStableList){
          window.fdStableList(matchList,round.matches||[],{
            key:(match)=>String(match.teamMatchId||match.team_match_id||''),
            signature:(match)=>[match.status,match.makeupStatus||match.makeup_status,match.makeupOn||match.makeup_on,match.teamAName,match.teamBName,match.tableNumber].join('|'),
            render:(match)=>{
              const card=document.createElement('article');card.className='match';card.dataset.status=String(match.status||'scheduled');const top=document.createElement('div');top.className='match-top';const table=document.createElement('span');table.textContent='Table '+(match.tableNumber||'—');const state=document.createElement('span');state.className='status-pill';state.dataset.tone=statusTone(match.status);state.textContent=statusLabel(match.status);top.append(table,state);if(match.makeupOn||match.makeup_on){const mb=document.createElement('span');mb.className='status-pill';mb.dataset.tone='warning';mb.textContent='Makeup '+(match.makeupOn||match.makeup_on);mb.style.marginLeft='6px';top.append(mb);}const versus=document.createElement('div');versus.className='versus';const teamA=document.createElement('strong');teamA.textContent=match.teamAName;const vs=document.createElement('span');vs.textContent='vs';const teamB=document.createElement('strong');teamB.textContent=match.teamBName;versus.append(teamA,vs,teamB);const actions=document.createElement('div');actions.className='match-actions';const score=document.createElement('a');const finalized=match.status==='finalized'||match.status==='corrected';const live=match.status==='in_progress';score.className=finalized?'':'primary';score.href='/scorecard?match='+encodeURIComponent(match.teamMatchId||'')+((match.makeupOn||match.makeup_on)?('&date='+encodeURIComponent(match.makeupOn||match.makeup_on)):'');score.textContent=finalized?'View final':(live?'Score live':'Score');score.setAttribute('aria-label',score.textContent+' — '+match.teamAName+' vs '+match.teamBName);const messages=document.createElement('a');messages.href='/messages?matchup='+encodeURIComponent(match.teamMatchId||'');messages.textContent='Messages';const lineup=document.createElement('a');lineup.href='/lineup?match='+encodeURIComponent(match.teamMatchId||'')+'&round='+encodeURIComponent(match.roundId||round.roundId||'');lineup.textContent='Lineup';lineup.setAttribute('aria-label','Lineup — '+match.teamAName+' vs '+match.teamBName);actions.append(score,lineup,messages);
        const makeup=document.createElement('div');
        makeup.className='makeup';

        const makeupState=match.makeupStatus||match.makeup_status;
        const makeupOn=match.makeupOn||match.makeup_on;
        const makeupLoc=match.makeupLocation||match.makeup_location;
        if(makeupState==='accepted'&&makeupOn){
          makeup.textContent='Makeup accepted · '+makeupOn+(makeupLoc?(' · '+makeupLoc):'')+(match.makeupNote||match.makeup_note?(' · '+(match.makeupNote||match.makeup_note)):'');
        }else if(makeupState==='proposed'&&makeupOn){
          makeup.textContent='Makeup proposed · '+makeupOn+(makeupLoc?(' · '+makeupLoc):'');
          const respond=document.createElement('div');
          respond.className='makeup-actions';
          const accept=document.createElement('button');accept.type='button';accept.textContent='Accept makeup';accept.dataset.makeupRespond=match.teamMatchId;accept.dataset.makeupResponse='accepted';
          const decline=document.createElement('button');decline.type='button';decline.className='ghost';decline.textContent='Decline';decline.dataset.makeupRespond=match.teamMatchId;decline.dataset.makeupResponse='declined';
          respond.append(accept,decline);
          makeup.append(respond);
        }else if(makeupState==='declined'){
          makeup.textContent='Makeup declined';
        }else if(!['finalized','corrected'].includes(String(match.status||''))){
          const form=document.createElement('div');
          form.className='makeup-form';
          const date=document.createElement('input');date.type='date';date.dataset.makeupOn=match.teamMatchId;date.setAttribute('aria-label','Makeup date');
          const place=document.createElement('input');place.type='text';place.maxLength=120;place.placeholder='Makeup location (optional)';place.setAttribute('data-safe-ac','makeupLocation');place.dataset.makeupLocation=match.teamMatchId;
          const propose=document.createElement('button');propose.type='button';propose.textContent='Propose makeup';propose.dataset.makeupPropose=match.teamMatchId;
          form.append(date,place,propose);
          makeup.append(form);
        }
        const protocol=document.createElement('div');protocol.className='muted';protocol.style.fontSize='.78rem';
        if(!['finalized','corrected'].includes(String(match.status||''))){
          protocol.textContent='No-show: after the agreed start, captains use explicit forfeit slots on the lineup/scorecard and note it in matchup messages. League admin resolves disputes.';
        }
        card.append(top,versus,actions,makeup,protocol);if(window.fdSafeAutocomplete)window.fdSafeAutocomplete.scan(card);return card;
            }
          });
        }else{
          matchList.replaceChildren();for(const match of round.matches){const card=document.createElement('article');card.className='match';card.dataset.status=String(match.status||'scheduled');const top=document.createElement('div');top.className='match-top';const table=document.createElement('span');table.textContent='Table '+(match.tableNumber||'—');const state=document.createElement('span');state.className='status-pill';state.dataset.tone=statusTone(match.status);state.textContent=statusLabel(match.status);top.append(table,state);if(match.makeupOn||match.makeup_on){const mb=document.createElement('span');mb.className='status-pill';mb.dataset.tone='warning';mb.textContent='Makeup '+(match.makeupOn||match.makeup_on);mb.style.marginLeft='6px';top.append(mb);}const versus=document.createElement('div');versus.className='versus';const teamA=document.createElement('strong');teamA.textContent=match.teamAName;const vs=document.createElement('span');vs.textContent='vs';const teamB=document.createElement('strong');teamB.textContent=match.teamBName;versus.append(teamA,vs,teamB);const actions=document.createElement('div');actions.className='match-actions';const score=document.createElement('a');const finalized=match.status==='finalized'||match.status==='corrected';const live=match.status==='in_progress';score.className=finalized?'':'primary';score.href='/scorecard?match='+encodeURIComponent(match.teamMatchId||'')+((match.makeupOn||match.makeup_on)?('&date='+encodeURIComponent(match.makeupOn||match.makeup_on)):'');score.textContent=finalized?'View final':(live?'Score live':'Score');score.setAttribute('aria-label',score.textContent+' — '+match.teamAName+' vs '+match.teamBName);const messages=document.createElement('a');messages.href='/messages?matchup='+encodeURIComponent(match.teamMatchId||'');messages.textContent='Messages';const lineup=document.createElement('a');lineup.href='/lineup?match='+encodeURIComponent(match.teamMatchId||'')+'&round='+encodeURIComponent(match.roundId||round.roundId||'');lineup.textContent='Lineup';actions.append(score,lineup,messages);
        const makeup=document.createElement('div');
        makeup.className='makeup';

        const makeupState=match.makeupStatus||match.makeup_status;
        const makeupOn=match.makeupOn||match.makeup_on;
        const makeupLoc=match.makeupLocation||match.makeup_location;
        if(makeupState==='accepted'&&makeupOn){
          makeup.textContent='Makeup accepted · '+makeupOn+(makeupLoc?(' · '+makeupLoc):'')+(match.makeupNote||match.makeup_note?(' · '+(match.makeupNote||match.makeup_note)):'');
        }else if(makeupState==='proposed'&&makeupOn){
          makeup.textContent='Makeup proposed · '+makeupOn+(makeupLoc?(' · '+makeupLoc):'');
          const respond=document.createElement('div');
          respond.className='makeup-actions';
          const accept=document.createElement('button');accept.type='button';accept.textContent='Accept makeup';accept.dataset.makeupRespond=match.teamMatchId;accept.dataset.makeupResponse='accepted';
          const decline=document.createElement('button');decline.type='button';decline.className='ghost';decline.textContent='Decline';decline.dataset.makeupRespond=match.teamMatchId;decline.dataset.makeupResponse='declined';
          respond.append(accept,decline);
          makeup.append(respond);
        }else if(makeupState==='declined'){
          makeup.textContent='Makeup declined';
        }else if(!['finalized','corrected'].includes(String(match.status||''))){
          const form=document.createElement('div');
          form.className='makeup-form';
          const date=document.createElement('input');date.type='date';date.dataset.makeupOn=match.teamMatchId;date.setAttribute('aria-label','Makeup date');
          const place=document.createElement('input');place.type='text';place.maxLength=120;place.placeholder='Makeup location (optional)';place.setAttribute('data-safe-ac','makeupLocation');place.dataset.makeupLocation=match.teamMatchId;
          const propose=document.createElement('button');propose.type='button';propose.textContent='Propose makeup';propose.dataset.makeupPropose=match.teamMatchId;
          form.append(date,place,propose);
          makeup.append(form);
        }
        const protocol=document.createElement('div');protocol.className='muted';protocol.style.fontSize='.78rem';
        if(!['finalized','corrected'].includes(String(match.status||''))){
          protocol.textContent='No-show: after the agreed start, captains use explicit forfeit slots on the lineup/scorecard and note it in matchup messages. League admin resolves disputes.';
        }
        card.append(top,versus,actions,makeup,protocol);if(window.fdSafeAutocomplete)window.fdSafeAutocomplete.scan(card);matchList.append(card)}
        }if(!round.matches.length){const noMatches=document.createElement('div');noMatches.className='empty';noMatches.textContent='No matchups are posted for this league night.';matchList.append(noMatches)}panel.hidden=false;localStorage.setItem('fd.scheduleRoundId',round.roundId);const url=new URL(location.href);url.searchParams.set('season',seasonSelect.value);url.searchParams.set('round',round.roundId);history.replaceState({},'',url)}
    async function loadSchedule(opts={}){const quiet=Boolean(opts&&opts.quiet);const seasonId=seasonSelect.value;if(!seasonId)return;const path='/api/seasons/'+encodeURIComponent(seasonId)+'/schedule';// WHY: paint last-known schedule immediately so the page feels snappy on mobile.
if(!quiet&&window.fdReadCachedJson){const cached=window.fdReadCachedJson(path);if(cached&&Array.isArray(cached.rounds)&&cached.rounds.length){rounds=cached.rounds;renderRoundOptions();setStatus('Updating schedule…','muted')}}else if(!quiet){setStatus('Loading schedule…')}const body=await get(path);if(body&&body.__notModified){if(!quiet)setStatus('Schedule up to date','ok');return}rounds=body.rounds||[];localStorage.setItem('fd.scheduleSeasonId',seasonId);renderRoundOptions();const liveCount=rounds.reduce((n,r)=>n+(r.matches||[]).filter((m)=>m.status==='in_progress').length,0);setStatus(rounds.length?(liveCount?liveCount+' match'+(liveCount===1?'':'es')+' live — open Score live from a card':'Schedule ready'):'Schedule not published',rounds.length?'ok':'muted')}
    async function bootstrap(){const body=await get('/api/seasons');seasons=body.seasons||[];renderSeasons();if(seasonSelect.value)await loadSchedule()}async function run(action){try{await action()}catch(error){setStatus((window.fdFriendlyError?window.fdFriendlyError(error):error.message),'error');panel.hidden=true;emptyEl.hidden=false}}document.addEventListener('click',(event)=>{
      const button=event.target.closest('button');
      if(!button)return;
      if(button.dataset.makeupPropose){event.preventDefault();run(()=>proposeMakeup(button.dataset.makeupPropose))}
      if(button.dataset.makeupRespond){event.preventDefault();run(()=>respondMakeup(button.dataset.makeupRespond,button.dataset.makeupResponse))}
    });
    seasonSelect.addEventListener('change',()=>run(loadSchedule));roundSelect.addEventListener('change',renderRound);run(bootstrap);
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>run(async()=>{if(seasonSelect.value)await loadSchedule(opts)}),{intervalMs:20000,immediate:false});
  </script>
${safeAutocompleteClientScript}
</body>
</html>`;
}
