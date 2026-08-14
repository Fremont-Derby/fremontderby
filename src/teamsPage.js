export function renderTeamsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Teams</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972;--gold:#d8ad3f;--red:#d45b50}
    *{box-sizing:border-box}input,select,textarea{font-size:16px}button,a,summary,select,input[type=button],input[type=submit]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}[hidden]{display:none!important}body{margin:0;min-height:100vh;min-height:100dvh;background:#111316}button,input,select{font:inherit}button{min-height:44px;border:1px solid transparent;border-radius:8px;font-weight:850;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}input,select{width:100%;min-height:44px;border:1px solid var(--line);border-radius:8px;background:#0d1013;color:#f5f1e9;padding:0 12px}label{display:grid;gap:6px;color:var(--muted);font-size:.78rem;font-weight:850}.app{width:min(1120px,100%);margin:0 auto;padding:16px}.topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;font-weight:950}.mark{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:#0d1511;background:var(--green);font-weight:950}.status{min-height:32px;color:var(--muted);text-align:right}.status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}.page-state{margin:18px 0;padding:clamp(20px,5vw,34px);border:1px solid #3c5449;border-top:5px solid var(--green);border-radius:14px;background:linear-gradient(145deg,rgba(47,169,114,.16),rgba(25,29,34,.96) 58%),radial-gradient(circle at 90% 12%,rgba(216,173,63,.14),transparent 34%);box-shadow:0 16px 38px rgba(0,0,0,.18)}.state-kicker{color:#9ee5bd;font-size:.72rem;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.page-state h1{margin:7px 0 8px;font-size:clamp(1.45rem,4vw,2.2rem);line-height:1.08}.page-state p{max-width:640px;margin:0;color:#c4ced3;line-height:1.55}.state-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.state-action{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 16px;border:1px solid var(--green);border-radius:9px;background:var(--green);color:#06120d;text-decoration:none;font-weight:950}.state-action--secondary{background:transparent;color:#9ee5bd}.night-hub{padding:16px 0;border-bottom:1px solid var(--line)}.hub-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:10px}.hub-kicker{display:block;color:#9ee5bd;font-size:.72rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.hub-heading h1{margin:3px 0 0;font-size:clamp(1.35rem,3.4vw,2rem);line-height:1}.hub-team{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:#11171b;color:#dce7e1;font-size:.76rem;font-weight:900}.hub-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}button.action-card{width:100%;text-align:left;font:inherit;cursor:pointer}.action-card{--accent:#9ee5bd;position:relative;min-width:0;min-height:126px;display:flex;flex-direction:column;gap:7px;padding:13px;border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:11px;background:#171c21;color:#f5f1e9;text-decoration:none;transition:transform .12s ease,background .12s ease}.action-card:hover{transform:translateY(-2px);background:#1d242a}.action-card:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.action-card--primary{grid-column:span 2;background:linear-gradient(145deg,rgba(47,169,114,.2),#171c21 68%)}.action-card[data-accent="gold"]{--accent:#e9bd45}.action-card[data-accent="blue"]{--accent:#69c8ff}.action-card[data-accent="purple"]{--accent:#d8a6ff}.action-card[data-accent="orange"]{--accent:#ffad8f}.action-label{color:var(--accent);font-size:.7rem;font-weight:950;letter-spacing:.05em;text-transform:uppercase}.action-card strong{font-size:.98rem;line-height:1.2}.action-meta{color:var(--muted);font-size:.76rem;line-height:1.35}.action-cta{margin-top:auto;color:#fff;font-size:.78rem;font-weight:950}.setup{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;padding:14px 0;border-bottom:1px solid var(--line);align-items:end}.primary{background:var(--green);color:#06120d}.secondary{background:var(--gold);color:#12100a}.ghost{background:transparent;color:#f5f1e9;border-color:var(--line)}.danger{background:var(--red);color:#1a0604}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;padding:14px 0}.metric{border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:12px;display:grid;gap:8px}.metric span{color:var(--muted);font-size:.72rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:1.25rem}.grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;padding-top:14px}.panel{border:1px solid var(--line);border-radius:8px;background:var(--panel);min-width:0;overflow:hidden}.panel-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;border-bottom:1px solid var(--line);font-weight:900}.stack{display:grid;gap:10px;padding:12px}.invite-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{color:var(--muted);font-size:.75rem;text-transform:uppercase}td{overflow-wrap:anywhere}tr:last-child td{border-bottom:0}.badge{display:inline-flex;align-items:center;min-height:28px;border-radius:999px;padding:0 10px;background:#26303a;color:#d8e4ea;font-size:.78rem;font-weight:900}.actions{display:flex;flex-wrap:wrap;gap:8px}.actions button{min-height:44px;padding:0 10px}.head-actions{display:flex;align-items:center;gap:8px;min-width:0}.chat-link,.signin{min-height:36px;display:inline-flex;align-items:center;padding:0 11px;border:1px solid var(--green);border-radius:8px;color:#9ee5bd;text-decoration:none;font-size:.82rem;font-weight:900;white-space:nowrap}.empty{padding:16px;color:var(--muted)}.hint{padding:10px 0;color:var(--muted);font-size:.85rem}.hint a{color:#f0d48b}.team-choice{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border-bottom:1px solid var(--line)}.team-choice:last-child{border-bottom:0}.team-choice strong{display:block}.team-choice small{display:block;color:var(--muted);margin-top:3px}.transfer{display:grid;grid-template-columns:minmax(160px,1fr) auto;gap:8px}button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #9ee5bd;outline-offset:2px}
    @media(max-width:840px){.app{padding:12px}.topbar{align-items:flex-start}.hub-heading{align-items:flex-start}.hub-grid{grid-template-columns:1fr 1fr}.action-card{min-height:116px}.action-card--primary{grid-column:1/-1;min-height:128px}.setup,.invite-row,.split,.team-choice{grid-template-columns:1fr}.status{text-align:left}.panel{overflow:hidden}table{width:100%;min-width:0;table-layout:fixed}th,td{padding:9px 6px;font-size:.78rem}th{font-size:.67rem}td{overflow-wrap:anywhere;word-break:break-word}.actions{display:grid;grid-template-columns:1fr;gap:6px}.actions button{width:100%;min-height:44px;padding:6px}.transfer{grid-template-columns:1fr}.head-actions{flex-wrap:wrap}.chat-link,.signin{min-height:44px;white-space:normal;text-align:center}.state-actions,.state-actions a,.state-actions button{width:100%}}@media(max-width:390px){.hub-heading{display:grid}.hub-team{justify-self:start}.action-card{padding:11px}.action-card strong{font-size:.92rem}.action-meta{font-size:.72rem}th,td{padding:8px 4px;font-size:.72rem}th{font-size:.62rem}}@media(prefers-reduced-motion:reduce){.action-card{transition:none}.action-card:hover{transform:none}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar"><div class="brand"><span class="mark">T</span><span>Fremont Derby Teams</span></div><div class="status" data-status role="status" aria-live="polite" aria-atomic="true"></div></header>
    <section class="page-state" data-page-state role="status" aria-live="polite" aria-atomic="true">
      <div class="state-kicker">Teams</div>
      <h1 data-state-title>Loading your teams…</h1>
      <p data-state-copy>Preparing your teams.</p>
      <div class="state-actions" data-state-actions></div>
    </section>
    <div data-team-content hidden>
    <section class="night-hub" data-night-hub aria-labelledby="league-night-title">
      <div class="hub-heading">
        <div><span class="hub-kicker">Next up</span><h1 id="league-night-title">League night</h1></div>
        <span class="hub-team" data-hub-team>Finding your team…</span>
      </div>
      <div class="hub-grid" data-action-cards>
        <a class="action-card action-card--primary" data-hub-lineup href="/lineup">
          <span class="action-label" data-hub-label>Next matchup</span>
          <strong data-hub-matchup>Finding your matchup…</strong>
          <span class="action-meta" data-hub-matchup-meta>Round, opponent, date, and table</span>
          <span class="action-cta" data-hub-lineup-cta>Build lineup →</span>
        </a>
        <a class="action-card" data-accent="blue" data-hub-availability href="/availability">
          <span class="action-label">League night</span>
          <strong>Weekly check-in</strong>
          <span class="action-meta">Morning of the match: say you&rsquo;ll be there, you&rsquo;re unsure, or you can&rsquo;t make it.</span>
          <span class="action-cta">Check in →</span>
        </a>
        <button class="action-card" data-accent="green" data-hub-ready-check type="button">
          <span class="action-label">Pulse the roster</span>
          <strong>Start ready check</strong>
          <span class="action-meta">Ask teammates to thumbs-up for tonight. They&rsquo;ll see a prompt when they open the app.</span>
          <span class="action-cta" data-hub-ready-check-cta>Send ready check →</span>
        </button>
        <a class="action-card" data-accent="gold" data-hub-score href="/scorecard">
          <span class="action-label" data-hub-score-label>During play</span>
          <strong data-hub-score-title>Score a match</strong>
          <span class="action-meta" data-hub-score-meta>Open a ready matchup and keep both scores together.</span>
          <span class="action-cta" data-hub-score-cta>Open scoring →</span>
        </a>
        <a class="action-card" data-accent="green" data-hub-schedule href="/schedule">
          <span class="action-label">Board</span>
          <strong>Tonight&rsquo;s schedule</strong>
          <span class="action-meta">Tables, live status, and Score live links for the league night.</span>
          <span class="action-cta">Open schedule →</span>
        </a>
        <a class="action-card" data-accent="purple" data-hub-chat href="/messages">
          <span class="action-label">Coordinate</span>
          <strong>Team chat</strong>
          <span class="action-meta">Message your team or tonight's opponent.</span>
          <span class="action-cta">Open messages →</span>
        </a>
        <a class="action-card" data-accent="orange" data-hub-manage href="/trades">
          <span class="action-label">Team management</span>
          <strong data-hub-manage-title>Roster & trades</strong>
          <span class="action-meta" data-hub-manage-meta>Handle invites, requests, and player moves.</span>
          <span class="action-cta" data-hub-manage-cta>Manage team →</span>
        </a>
      </div>
    </section>
    <form class="setup" data-create-form>
      <label>Season<select name="seasonId" data-season-select><option value="">Loading open season…</option></select></label>
      <label>Team name<input name="teamName" data-team-name autocomplete="off" maxlength="80" placeholder="Team name" /></label>
      <button class="primary" data-create-team type="submit">Apply for team slot</button>
    </form>
    <div class="hint" data-season-help hidden>Team registration is not open right now. You can still review your current team activity below.</div>
    <section class="summary" data-registration-summary aria-label="Season registration progress"></section>
    <section class="grid">
      <article class="panel"><div class="panel-head"><span>My team applications</span><span class="badge">Admin reviewed</span></div><div data-applications></div></article>
      <article class="panel"><div class="panel-head"><span>Returning team reservations</span></div><div data-returning-slots></div></article>
      <article class="panel" id="join-teams"><div class="panel-head"><span>Join a team</span><button class="ghost" data-refresh type="button">Refresh</button></div><div data-join-teams></div></article>
      <article class="panel"><div class="panel-head"><span>My membership requests</span></div><div data-player-requests></div></article>
      <article class="panel"><div class="panel-head"><span>Requests for teams I captain</span></div><div data-captain-requests></div></article>
      <article class="panel"><div class="panel-head"><span>My invitations</span></div><div data-invitations></div></article>
      <div data-captain-teams></div>
    </section>
    </div>
  </main>
  <script>
    const createForm=document.querySelector('[data-create-form]');const seasonSelect=document.querySelector('[data-season-select]');const teamNameInput=document.querySelector('[data-team-name]');const createTeamButton=document.querySelector('[data-create-team]');const seasonHelp=document.querySelector('[data-season-help]');const statusEl=document.querySelector('[data-status]');const pageStateEl=document.querySelector('[data-page-state]');const stateTitleEl=document.querySelector('[data-state-title]');const stateCopyEl=document.querySelector('[data-state-copy]');const stateActionsEl=document.querySelector('[data-state-actions]');const teamContentEl=document.querySelector('[data-team-content]');const captainTeamsEl=document.querySelector('[data-captain-teams]');const invitationsEl=document.querySelector('[data-invitations]');const joinTeamsEl=document.querySelector('[data-join-teams]');const playerRequestsEl=document.querySelector('[data-player-requests]');const captainRequestsEl=document.querySelector('[data-captain-requests]');const applicationsEl=document.querySelector('[data-applications]');const returningSlotsEl=document.querySelector('[data-returning-slots]');const registrationSummaryEl=document.querySelector('[data-registration-summary]');const hubTeamEl=document.querySelector('[data-hub-team]');const hubLineup=document.querySelector('[data-hub-lineup]');const hubLabel=document.querySelector('[data-hub-label]');const hubMatchup=document.querySelector('[data-hub-matchup]');const hubMatchupMeta=document.querySelector('[data-hub-matchup-meta]');const hubLineupCta=document.querySelector('[data-hub-lineup-cta]');const hubChat=document.querySelector('[data-hub-chat]');const hubManage=document.querySelector('[data-hub-manage]');const hubManageTitle=document.querySelector('[data-hub-manage-title]');const hubManageMeta=document.querySelector('[data-hub-manage-meta]');const hubManageCta=document.querySelector('[data-hub-manage-cta]');const hubScore=document.querySelector('[data-hub-score]');const hubScoreLabel=document.querySelector('[data-hub-score-label]');const hubScoreTitle=document.querySelector('[data-hub-score-title]');const hubScoreMeta=document.querySelector('[data-hub-score-meta]');const hubScoreCta=document.querySelector('[data-hub-score-cta]');const hubReadyCheck=document.querySelector('[data-hub-ready-check]');const hubReadyCheckCta=document.querySelector('[data-hub-ready-check-cta]');let playerDirectory=[];let publicSeasons=[];
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}function stateLink(label,href){const link=document.createElement('a');link.className='state-action';link.href=href;link.textContent=label;return link}function showPageState(kind){teamContentEl.hidden=true;pageStateEl.hidden=false;stateActionsEl.replaceChildren();if(kind==='loading'){stateTitleEl.textContent='Loading your teams…';stateCopyEl.textContent='Preparing your teams.';setStatus('Loading…');return}if(kind==='signedout'){stateTitleEl.textContent='Sign in to manage teams';stateCopyEl.textContent='Join a team, respond to invitations, or manage a roster after signing in with Google.';stateActionsEl.append(stateLink('Sign in to manage teams','/profile'));setStatus('Sign in to manage teams.');return}if(kind==='expired'){stateTitleEl.textContent='Your sign-in expired';stateCopyEl.textContent='Sign in again to continue. Your team information was not changed.';stateActionsEl.append(stateLink('Sign in again','/profile'));setStatus('Your sign-in expired.','error');return}stateTitleEl.textContent='Couldn’t load your teams';stateCopyEl.textContent='Something interrupted the connection. Try again; anything you already typed will stay here.';const retry=document.createElement('button');retry.type='button';retry.className='state-action';retry.dataset.retry='';retry.textContent='Try again';stateActionsEl.append(retry);setStatus('Couldn’t load teams.','error')}function showTeamContent(){pageStateEl.hidden=true;teamContentEl.hidden=false}function accessToken(){return sessionStorage.getItem('fd.accessToken')||''}function requireToken(){const value=accessToken();if(!value)throw new Error('Sign in with Google to manage teams.');return value}async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}async function api(path,options={}){const method=(options.method||'GET').toUpperCase();const headers={authorization:'Bearer '+requireToken(),'content-type':'application/json',...(options.headers||{})};if(method==='GET'&&window.fdConditionalFetch&&!options.body){const result=await window.fdConditionalFetch(path,{headers});if(result.notModified)return{__notModified:true};const body=result.body||{};if(result.response.status===401){sessionStorage.removeItem('fd.accessToken');const error=new Error('Your sign-in expired.');error.name='SessionExpiredError';throw error}if(!result.response.ok)throw new Error(body.error||'Request failed');return body}const response=await fetch(path,{...options,headers});const body=await parseJson(response);if(response.status===401){sessionStorage.removeItem('fd.accessToken');const error=new Error('Your sign-in expired.');error.name='SessionExpiredError';throw error}if(!response.ok)throw new Error(body.error||'Request failed');return body}function text(value){return value==null||value===''?'-':String(value)}function cell(value){const td=document.createElement('td');td.textContent=text(value);return td}function actionButton(label,className,dataset){const button=document.createElement('button');button.type='button';button.className=className;button.textContent=label;for(const [key,value] of Object.entries(dataset))button.dataset[key]=value;return button}function empty(message){const div=document.createElement('div');div.className='empty';div.textContent=message;return div}
    function dateLabel(value){if(!value)return'Date TBD';const date=new Date(value+'T12:00:00');return new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(date)}
    function nextCaptainMatchup(teams){const contexts=[];for(const team of teams){for(const round of team.lineupRounds||[]){contexts.push({team,round})}}contexts.sort((left,right)=>String(left.round.scheduledOn||'9999-12-31').localeCompare(String(right.round.scheduledOn||'9999-12-31'))||Number(left.round.roundNumber)-Number(right.round.roundNumber));const today=new Date().toISOString().slice(0,10);const open=contexts.filter((item)=>!['finalized','corrected'].includes(item.round.teamMatchStatus));return open.find((item)=>!item.round.scheduledOn||item.round.scheduledOn>=today)||open[0]||contexts[0]||null}
    function renderLeagueNightHub(data,scorable){const teams=data.captain_teams||[];const liveMatches=(scorable||[]).filter((m)=>String(m.status||m.match_status||'')==='in_progress');const readyMatches=scorable||[];function paintScoreCard(match){if(!hubScore)return;if(!match){hubScore.href='/scorecard';if(hubScoreLabel)hubScoreLabel.textContent='During play';if(hubScoreTitle)hubScoreTitle.textContent='Score a match';if(hubScoreMeta)hubScoreMeta.textContent='Open a ready matchup and keep both scores together.';if(hubScoreCta)hubScoreCta.textContent='Open scoring →';return}const live=String(match.status||match.match_status||'')==='in_progress';const matchId=match.playerMatchId||match.player_match_id||match.teamMatchId||match.team_match_id||'';const teamId=match.scoringTeamId||match.scoring_team_id||match.teamId||'';const teamName=match.scoringTeamName||match.scoring_team_name||match.teamName||'Your team';const qs=new URLSearchParams();if(matchId)qs.set('match',matchId);if(teamId)qs.set('team',teamId);if(teamName)qs.set('teamName',teamName);hubScore.href='/scorecard'+(qs.toString()?('?'+qs.toString()):'');if(hubScoreLabel)hubScoreLabel.textContent=live?'Live now':'Ready to score';if(hubScoreTitle)hubScoreTitle.textContent=live?'Score live':'Score this match';if(hubScoreMeta)hubScoreMeta.textContent=(match.opponentName||match.opponent_name||match.matchupLabel||'Your matchup')+(live?' · in progress':' · open scoring');if(hubScoreCta)hubScoreCta.textContent=live?'Continue scoring →':'Start scoring →'}
const context=nextCaptainMatchup(teams);if(context){const team=context.team;const round=context.round;hubTeamEl.textContent=team.teamName;hubLabel.textContent='Next matchup';hubMatchup.textContent='Round '+round.roundNumber+' vs '+(round.opponentName||'Opponent');hubMatchupMeta.textContent=dateLabel(round.scheduledOn)+' · Table '+round.tableNumber;hubLineupCta.textContent='Build lineup →';hubLineup.href='/lineup?team='+encodeURIComponent(team.teamId)+'&round='+encodeURIComponent(round.roundId);if(hubReadyCheck){hubReadyCheck.dataset.teamId=team.teamId;hubReadyCheck.dataset.roundId=round.roundId;hubReadyCheck.disabled=false;if(hubReadyCheckCta)hubReadyCheckCta.textContent='Send ready check →';}hubChat.href='/messages?team='+encodeURIComponent(team.teamId);hubManage.href='/trades';hubManageTitle.textContent='Roster & trades';hubManageMeta.textContent='Handle invites, requests, and player moves.';hubManageCta.textContent='Manage team →';paintScoreCard(liveMatches[0]||readyMatches[0]||null);return}if(teams.length){hubTeamEl.textContent=teams[0].teamName;hubLabel.textContent='Captain tools';hubMatchup.textContent='No published matchup yet';hubMatchupMeta.textContent='Your next round will appear here as soon as it is scheduled.';hubLineupCta.textContent='Review lineups →';hubLineup.href='/lineup';hubChat.href='/messages?team='+encodeURIComponent(teams[0].teamId);hubManage.href='/trades';hubManageTitle.textContent='Roster & trades';hubManageMeta.textContent='Handle invites, requests, and player moves.';hubManageCta.textContent='Manage team →';paintScoreCard(liveMatches[0]||readyMatches[0]||null);return}hubTeamEl.textContent='Player';hubLabel.textContent='Your next step';hubMatchup.textContent='Find your team';hubMatchupMeta.textContent='Request to join a team or apply for an open team slot.';hubLineupCta.textContent='Join or apply →';hubLineup.href='#join-teams';hubManage.href='#join-teams';hubManageTitle.textContent='Join a team';hubManageMeta.textContent='See open teams and send a request to the captain.';hubManageCta.textContent='View teams →';paintScoreCard(liveMatches[0]||readyMatches[0]||null)}

    function playerOptionLabel(player){
      if(player&&player.label)return player.label;
      const name=player&&player.displayName||player&&player.display_name||'Player';
      const parts=[];
      if(player&&player.hasLogin)parts.push('Account linked');
      else if(player&&player.hasLogin===false)parts.push('Unclaimed');
      if(player&&player.isDuplicateName){
        const id=String(player.playerId||player.id||'');
        if(id)parts.push('#'+id.slice(-4));
      }
      const created=player&&(player.createdAt||player.created_at);
      if(created){const y=String(created).slice(0,4);if(/^\d{4}$/.test(y))parts.push('Added '+y)}
      return parts.length?name+' — '+parts.join(' · '):name;
    }
    function fillPlayerSelect(select,players){
      if(!select)return;
      const previous=select.value;
      select.replaceChildren();
      const blank=document.createElement('option');
      blank.value='';
      blank.textContent='Choose a player…';
      select.append(blank);
      const list=Array.isArray(players)?players:[];
      for(const player of list){
        const option=document.createElement('option');
        option.value=player.playerId||player.id||'';
        option.textContent=playerOptionLabel(player);
        select.append(option);
      }
      if(previous&&Array.from(select.options).some((item)=>item.value===previous))select.value=previous;
    }
    function renderInvitations(items){
      if(!invitationsEl)return;
      invitationsEl.replaceChildren();
      if(!items.length){invitationsEl.append(empty('No open invitations.'));return}
      for(const item of items){
        const row=document.createElement('div');
        row.className='card';
        row.append(node('strong',item.teamName||'Team'),node('div',(item.seasonName||'')+(item.status?' · '+item.status:''),'muted'));
        const actions=document.createElement('div');
        actions.className='actions';
        if(item.invitationId){
          actions.append(actionButton('Accept','primary',{respondInvitation:item.invitationId,response:'accepted'}));
          actions.append(actionButton('Decline','ghost',{respondInvitation:item.invitationId,response:'declined'}));
        }
        row.append(actions);
        invitationsEl.append(row);
      }
    }
    function renderCaptainTeams(teams){
      if(!captainTeamsEl)return;
      captainTeamsEl.replaceChildren();
      if(!teams.length){captainTeamsEl.append(empty('You are not captaining a team yet.'));return}
      for(const team of teams){
        const card=document.createElement('div');
        card.className='card';
        card.append(node('h2',team.teamName||'Team'));
        card.append(node('div',(team.seasonName||'')+(team.role?' · '+team.role:''),'muted'));
        const members=Array.isArray(team.members)?team.members:(Array.isArray(team.roster)?team.roster:[]);
        if(members.length){
          const list=document.createElement('ul');
          for(const member of members){
            const li=document.createElement('li');
            li.textContent=playerOptionLabel({
              displayName:member.displayName||member.display_name||member.playerName,
              hasLogin:member.hasLogin,
              playerId:member.playerId||member.id,
              isDuplicateName:false,
            });
            list.append(li);
          }
          card.append(list);
        }
        const invite=document.createElement('div');
        invite.className='invite-row';
        const label=document.createElement('label');
        label.textContent='Invite a player';
        const select=document.createElement('select');
        select.dataset.invitePlayerSelect=team.teamId||team.id||'';
        fillPlayerSelect(select,playerDirectory);
        label.append(select);
        const button=actionButton('Send invite','primary',{inviteTeam:team.teamId||team.id||''});
        invite.append(label,button);
        card.append(invite);
        captainTeamsEl.append(card);
      }
    }
    function renderJoinTeams(items){
      if(!joinTeamsEl)return;
      joinTeamsEl.replaceChildren();
      if(!items.length){joinTeamsEl.append(empty('No teams are open to join right now.'));return}
      for(const team of items){
        const row=document.createElement('div');
        row.className='card';
        row.append(node('strong',team.teamName||'Team'),node('div',team.seasonName||'','muted'));
        row.append(actionButton('Request to join','primary',{requestMembership:team.teamId||team.id||''}));
        joinTeamsEl.append(row);
      }
    }
    function renderPlayerRequests(items){
      if(!playerRequestsEl)return;
      playerRequestsEl.replaceChildren();
      if(!items.length){playerRequestsEl.append(empty('No membership requests from you.'));return}
      for(const item of items){
        const row=document.createElement('div');
        row.className='card';
        row.append(node('strong',item.teamName||'Team'),node('div',item.status||'','muted'));
        if(item.requestId)row.append(actionButton('Cancel request','ghost',{cancelMembershipRequest:item.requestId}));
        playerRequestsEl.append(row);
      }
    }
    function renderCaptainRequests(items){
      if(!captainRequestsEl)return;
      captainRequestsEl.replaceChildren();
      if(!items.length){captainRequestsEl.append(empty('No pending join requests for your teams.'));return}
      for(const item of items){
        const row=document.createElement('div');
        row.className='card';
        const who=item.playerDisplayName||item.displayName||'Player';
        row.append(node('strong',who+' → '+(item.teamName||'Team')));
        row.append(node('div',playerOptionLabel({
          displayName:who,
          hasLogin:item.hasLogin,
          registrationStatus:item.registrationStatus,
          paymentStatus:item.paymentStatus,
          playerId:item.playerId,
          isDuplicateName:Boolean(item.isDuplicateName),
          createdAt:item.createdAt,
        }),'muted'));
        const actions=document.createElement('div');
        actions.className='actions';
        if(item.requestId){
          actions.append(actionButton('Approve','primary',{respondMembershipRequest:item.requestId,response:'approved'}));
          actions.append(actionButton('Decline','ghost',{respondMembershipRequest:item.requestId,response:'declined'}));
        }
        row.append(actions);
        captainRequestsEl.append(row);
      }
    }
    function renderSeasonOptions(seasons){
      if(!seasonSelect)return;
      const previous=seasonSelect.value||localStorage.getItem('fd.teamsSeasonId')||'';
      seasonSelect.replaceChildren();
      if(!seasons.length){
        const option=document.createElement('option');
        option.value='';
        option.textContent='No registration season open';
        seasonSelect.append(option);
        seasonSelect.disabled=true;
        if(createTeamButton)createTeamButton.disabled=true;
        if(seasonHelp)seasonHelp.textContent='Team registration is not open right now.';
        return;
      }
      seasonSelect.disabled=false;
      if(createTeamButton)createTeamButton.disabled=false;
      for(const season of seasons){
        const option=document.createElement('option');
        option.value=season.seasonId||season.id;
        option.textContent=season.name||season.seasonName||'Season';
        seasonSelect.append(option);
      }
      if(previous&&Array.from(seasonSelect.options).some((item)=>item.value===previous))seasonSelect.value=previous;
      if(seasonHelp)seasonHelp.textContent='Choose the open registration season for your team application.';
    }
    function renderRegistrationSummary(season){
      if(!registrationSummaryEl)return;
      if(!season||!Object.keys(season).length){
        registrationSummaryEl.textContent='Team registration is not open right now.';
        return;
      }
      registrationSummaryEl.textContent=(season.name||'Season')+' · registration '+(season.status||'open');
    }
    async function loadRegistration(){
      try{
        const season=publicSeasons[0]||null;
        renderRegistrationSummary(season);
      }catch{
        renderRegistrationSummary(null);
      }
    }
    function node(tag,text,className){
      const el=document.createElement(tag);
      if(text!=null)el.textContent=text;
      if(className)el.className=className;
      return el;
    }

function renderManagement(data,scorable){renderLeagueNightHub(data,scorable);renderInvitations(data.invitations||[]);renderCaptainTeams(data.captain_teams||[])}function renderMembershipRequests(data){renderJoinTeams(data.joinable_teams||[]);renderPlayerRequests(data.player_requests||[]);renderCaptainRequests(data.captain_requests||[])}
    async function loadTeams(opts={}){const quiet=Boolean(opts&&opts.quiet);const token=sessionStorage.getItem('fd.accessToken')||'';const scorablePromise=token?fetch('/api/me/scorable-matches',{headers:{authorization:'Bearer '+token}}).then(async(r)=>{try{const b=await r.json();return r.ok?(b.matches||[]):[]}catch{return[]}}).catch(()=>[]):Promise.resolve([]);const [teamsBody,requestsBody,seasonsBody,scorable]=await Promise.all([api('/api/me/teams',{method:'GET'}),api('/api/me/team-membership-requests',{method:'GET'}),api('/api/seasons',{method:'GET'}),scorablePromise]);if(teamsBody&&teamsBody.__notModified){if(!quiet)setStatus('Teams up to date','ok');return teamsBody}const data=teamsBody.teamManagement||{captain_teams:[],invitations:[],open_seasons:[],players:[]};playerDirectory=data.players||[];publicSeasons=(seasonsBody.seasons||[]).filter((season)=>season.status==='registration');renderSeasonOptions(publicSeasons);renderManagement(data,scorable);renderMembershipRequests(requestsBody.requests||{});await loadRegistration();return data}
    async function loadInitialTeams(){showPageState('loading');try{await loadTeams();showTeamContent();setStatus('Teams loaded','ok')}catch(error){if(error.name==='SessionExpiredError')showPageState('expired');else showPageState('failure')}}
    async function applyForTeam(){const seasonId=seasonSelect.value;const teamName=teamNameInput.value.trim();if(!seasonId)throw new Error('No registration season is open.');if(!teamName)throw new Error('Team name is required');localStorage.setItem('fd.teamsSeasonId',seasonId);setStatus('Submitting application...');await api('/api/seasons/'+encodeURIComponent(seasonId)+'/team-applications',{method:'POST',body:JSON.stringify({teamName})});teamNameInput.value='';await loadTeams();setStatus('Application submitted for admin review','ok')}
    async function withdrawApplication(applicationId){setStatus('Withdrawing application...');await api('/api/team-applications/'+encodeURIComponent(applicationId)+'/withdraw',{method:'POST',body:'{}'});await loadTeams();setStatus('Application withdrawn','ok')}
    async function respondToSlot(slotId,action){const select=document.querySelector('[data-transfer-player="'+slotId+'"]');const transferPlayerId=select?select.value:'';if(action==='transfer'&&!transferPlayerId)throw new Error('Choose a player for the transfer');setStatus('Updating reservation...');await api('/api/team-slots/'+encodeURIComponent(slotId)+'/respond',{method:'POST',body:JSON.stringify({action,transferPlayerId:transferPlayerId||null})});await loadTeams();setStatus(action==='confirm'?'Returning team confirmed':'Reservation updated','ok')}
    async function invitePlayer(teamId){const select=Array.from(document.querySelectorAll('[data-invite-player-select]')).find((candidate)=>candidate.dataset.invitePlayerSelect===teamId);const playerId=select?select.value:'';if(!playerId)throw new Error('Choose a player to invite');setStatus('Sending invitation...');await api('/api/teams/'+encodeURIComponent(teamId)+'/invitations',{method:'POST',body:JSON.stringify({playerId})});await loadTeams();setStatus('Invitation sent','ok')}
    async function requestMembership(teamId){setStatus('Sending join request...');await api('/api/teams/'+encodeURIComponent(teamId)+'/membership-request',{method:'POST',body:'{}'});await loadTeams();setStatus('Join request sent','ok')}async function cancelMembershipRequest(requestId){setStatus('Canceling join request...');await api('/api/team-membership-requests/'+encodeURIComponent(requestId)+'/cancel',{method:'POST',body:'{}'});await loadTeams();setStatus('Join request canceled','ok')}async function respondToMembershipRequest(requestId,response){setStatus(response==='approved'?'Approving player...':'Declining request...');await api('/api/team-membership-requests/'+encodeURIComponent(requestId)+'/respond',{method:'POST',body:JSON.stringify({response})});await loadTeams();setStatus(response==='approved'?'Player added to team':'Request declined','ok')}
    async function cancelInvitation(invitationId){setStatus('Canceling invitation...');await api('/api/team-invitations/'+encodeURIComponent(invitationId)+'/cancel',{method:'POST',body:'{}'});await loadTeams();setStatus('Invitation canceled','ok')}async function removeMember(membershipId){setStatus('Removing member...');await api('/api/team-memberships/'+encodeURIComponent(membershipId)+'/remove',{method:'POST',body:'{}'});await loadTeams();setStatus('Roster updated','ok')}async function respondToInvitation(invitationId,response){setStatus(response==='accepted'?'Accepting invitation...':'Declining invitation...');await api('/api/team-invitations/'+encodeURIComponent(invitationId)+'/respond',{method:'POST',body:JSON.stringify({response})});await loadTeams();setStatus('Invitation '+response,'ok')}async function run(action){try{await action()}catch(error){if(error.name==='SessionExpiredError')showPageState('expired');else setStatus(error.message,'error')}}
    createForm.addEventListener('submit',(event)=>{event.preventDefault();run(applyForTeam)});seasonSelect.addEventListener('change',()=>{if(seasonSelect.value)localStorage.setItem('fd.teamsSeasonId',seasonSelect.value);run(loadRegistration)});document.querySelector('[data-refresh]').addEventListener('click',()=>run(async()=>{await loadTeams();setStatus('Teams loaded','ok')}));document.addEventListener('click',(event)=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-retry'))loadInitialTeams();
    if(button.dataset.inviteTeam)run(()=>invitePlayer(button.dataset.inviteTeam));if(button.dataset.cancelInvitation)run(()=>cancelInvitation(button.dataset.cancelInvitation));if(button.dataset.removeMembership)run(()=>removeMember(button.dataset.removeMembership));if(button.dataset.respondInvitation)run(()=>respondToInvitation(button.dataset.respondInvitation,button.dataset.response));if(button.dataset.requestMembership)run(()=>requestMembership(button.dataset.requestMembership));if(button.dataset.cancelMembershipRequest)run(()=>cancelMembershipRequest(button.dataset.cancelMembershipRequest));if(button.dataset.respondMembershipRequest)run(()=>respondToMembershipRequest(button.dataset.respondMembershipRequest,button.dataset.response));if(button.dataset.withdrawApplication)run(()=>withdrawApplication(button.dataset.withdrawApplication));if(button.dataset.respondSlot)run(()=>respondToSlot(button.dataset.respondSlot,button.dataset.slotAction))});
    if(accessToken())loadInitialTeams();else showPageState('signedout')
  
    if(hubReadyCheck){hubReadyCheck.addEventListener('click',async()=>{const teamId=hubReadyCheck.dataset.teamId;const roundId=hubReadyCheck.dataset.roundId;if(!teamId||!roundId){setStatus('Pick a published matchup first so the ready check has a league night.','error');return}hubReadyCheck.disabled=true;if(hubReadyCheckCta)hubReadyCheckCta.textContent='Sending…';try{const token=sessionStorage.getItem('fd.accessToken')||'';if(!token)throw new Error('Sign in to start a ready check.');const response=await fetch('/api/teams/ready-checks',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({teamId,roundId})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Could not start ready check');setStatus('Ready check sent — teammates will see a prompt when they open the app.','ok');if(hubReadyCheckCta)hubReadyCheckCta.textContent='Ready check sent';}catch(error){setStatus(error.message||'Could not start ready check','error');if(hubReadyCheckCta)hubReadyCheckCta.textContent='Send ready check →';hubReadyCheck.disabled=false}})}

    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>run(async()=>{await loadTeams(opts)}),{intervalMs:20000,immediate:false});
  </script>
</body>
</html>`;
}
