export const sharedRackLedgerScorecardStyles = `
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;min-height:100dvh;overflow-x:hidden}input,select,textarea{font-size:16px}
  button,summary{font:inherit;min-height:48px;border:1px solid transparent;border-radius:11px;padding:9px 12px;font-weight:850;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  button:disabled{opacity:.42;cursor:not-allowed}
  .scorecard-app{width:min(760px,100%);margin:auto;padding:10px 8px max(20px,env(safe-area-inset-bottom))}
  .scorecard-status{min-height:28px;display:flex;justify-content:flex-end;align-items:center;font-size:.76rem}
  .match-context{position:relative;min-height:42px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.9rem;font-weight:800;text-align:center}
  .match-context a{position:absolute;right:12px;font-size:.72rem;text-decoration:none}
  .sandbox-banner{margin:0 0 8px;padding:10px 12px;border:1px solid;border-radius:13px;font-size:.75rem;line-height:1.35}
  .sandbox-banner strong{display:block;font-size:.8rem;margin-bottom:2px}
  .perspective{margin:0 0 8px;padding:8px;border:1px solid;border-radius:13px;display:none;gap:7px;align-items:center}
  .perspective[data-open=true]{display:grid;grid-template-columns:auto 1fr 1fr}
  .perspective span{font-size:.72rem;font-weight:800}
  .perspective button{min-height:44px}
  .perspective button[aria-pressed=true]{font-weight:950}
  .opening-setup{margin:0 0 8px;padding:8px;display:grid;grid-template-columns:auto minmax(210px,1fr);gap:10px;align-items:center}
  .opening-copy strong{display:block;font-size:.78rem}.opening-copy span{display:block;margin-top:2px;font-size:.64rem}
  .opening-options{display:grid;grid-template-columns:1fr 1fr;gap:6px}.opening-option{min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  .team-score{border:1px solid;border-radius:16px;padding:12px 14px;display:grid;gap:7px}
  .team-score-label{text-align:center;font-size:.7rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
  .team-score-grid{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}
  .team-block{min-width:0;text-align:center}.team-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1rem;font-weight:900}
  .team-points{display:block;margin-top:3px;font-size:clamp(2.3rem,12vw,4.2rem);line-height:.88;font-weight:1000;letter-spacing:-.06em}.team-separator{font-size:2rem;font-weight:700}
  .race{margin-top:8px;border:1px solid;border-radius:16px;overflow:hidden}
  .race-context{position:relative;padding:8px 10px;border-bottom:1px solid;display:flex;justify-content:center;gap:8px;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
  .race-context strong{position:absolute;right:18px;text-transform:none;letter-spacing:0}
  .players{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;padding:12px 10px 10px}
  .player{min-width:0}.player:last-child{text-align:right}.player-name{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(1.05rem,4.5vw,1.4rem)}
  .player-meta{margin-top:2px;font-size:.66rem}.race-target{margin-top:4px;font-size:.75rem}.race-target b{font-size:.95rem}
  .individual-score{display:flex;align-items:center;gap:9px;padding:0 12px;font-size:clamp(2.8rem,14vw,4.8rem);line-height:.8;font-weight:1000;letter-spacing:-.07em;white-space:nowrap}
  .individual-score span:nth-child(2){font-size:.48em;font-weight:600}
  .ledger-panel{margin:0 8px 8px;border:1px solid;border-radius:13px;overflow:hidden}
  .ledger-head{min-height:40px;padding:7px 9px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid}.ledger-head strong{font-size:.8rem}.ledger-state{font-size:.66rem;text-align:right}
  .ledger-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;touch-action:pan-x}
  .ledger{border-collapse:separate;border-spacing:0;min-width:100%;width:max-content}.ledger th,.ledger td{min-width:58px;height:48px;border-right:1px solid;border-bottom:1px solid;text-align:center;padding:4px}
  .ledger tr:last-child th,.ledger tr:last-child td{border-bottom:0}.ledger th:last-child,.ledger td:last-child{border-right:0}
  .ledger .row-label{position:sticky;left:0;z-index:2;width:105px;min-width:105px;max-width:105px;padding:5px 7px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.72rem}
  .rack-number{display:inline-block;font-size:.72rem;margin-right:3px}.game-chip{display:inline-grid;place-items:center;width:23px;height:23px;border:1px solid;border-radius:50%;font-size:.65rem;font-weight:1000}
  .submission{font-size:1.08rem;font-weight:1000}.submission[data-value=W]{font-weight:1000}.submission[data-value=L]{font-weight:1000}
  .submission[data-state=matched]{box-shadow:inset 0 -3px 0 #18864a}.submission[data-state=pending]{box-shadow:inset 0 -3px 0 #c99d15}.submission[data-state=mismatch]{box-shadow:inset 0 0 0 2px #d84d43}.submission[data-state=unplayed]{opacity:.6}
  .rack-head[data-state=mismatch],.rack-status[data-state=mismatch]{box-shadow:inset 0 0 0 2px #d84d43}.rack-head[data-state=pending],.rack-status[data-state=pending]{box-shadow:inset 0 -3px 0 #c99d15}
  .rack-edit{width:100%;height:100%;min-height:40px;padding:3px;background:transparent;color:inherit;border-color:transparent;border-radius:8px;font-size:1.05rem}.rack-edit::after{content:'✎';display:block;margin-top:1px;font-size:.48rem}.rack-edit[data-pending=true]::after{content:'answer';font-size:.45rem}
  .rack-status{font-size:.82rem;font-weight:1000}
  .ledger-help{padding:7px 9px;text-align:center;font-size:.68rem;border-top:1px solid}
  .edit-panel{margin-top:8px;padding:10px;border:1px solid;border-radius:14px}.edit-panel[hidden]{display:none}.edit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.edit-head strong{font-size:.9rem}.edit-head span{display:block;margin-top:2px;font-size:.67rem}.edit-close{min-width:44px;min-height:44px;padding:4px;background:transparent}
  .edit-compare{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.edit-value{padding:7px;border:1px solid;border-radius:9px}.edit-value span{display:block;font-size:.61rem}.edit-value strong{display:block;margin-top:2px;font-size:1rem}
  .edit-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.edit-result{min-height:54px}.edit-note{margin:7px 1px 0;font-size:.64rem;line-height:1.35}
  .next-rack{margin-top:8px}.add-rack{width:100%;min-height:62px;font-size:1.05rem}.winner-picker{display:none;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px;padding:8px;border:1px solid;border-radius:12px}.winner-picker[data-open=true]{display:grid}.winner{min-height:56px;overflow:hidden;text-overflow:ellipsis}
  .reconcile{margin-top:8px;padding:9px 10px;border:1px solid;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}.reconcile strong{font-size:.8rem}.reconcile span{font-size:.67rem;text-align:right}
  .quick-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;padding:8px 0}.quick-actions button,.quick-actions summary{min-height:48px}
  .details{border:1px solid;border-radius:11px;overflow:hidden}.details summary{min-height:48px;padding:13px;cursor:pointer;font-size:.78rem;font-weight:900;list-style:none;text-align:center}.details summary::-webkit-details-marker{display:none}.details summary::marker{content:''}.details summary{-webkit-appearance:none;appearance:none}
  .detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:9px;border-top:1px solid}.detail span{display:block;font-size:.6rem}.detail strong{display:block;margin-top:2px;overflow-wrap:anywhere;font-size:.72rem}
  .completion-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.confirm,.finalize{min-height:48px}
  .error-popup{position:fixed;z-index:30;left:50%;bottom:max(16px,env(safe-area-inset-bottom));width:min(430px,calc(100% - 24px));transform:translateX(-50%);display:none;padding:11px 13px;border:1px solid;border-radius:12px}.error-popup[data-open=true]{display:block}.error-popup strong{display:block;font-size:.8rem}.error-popup span{display:block;margin-top:2px;font-size:.7rem}
  .sandbox-footer{margin-top:10px;padding:10px;border:1px solid;border-radius:13px}.sandbox-footer textarea{width:100%;min-height:72px;padding:9px}.sandbox-footer-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:7px}.sandbox-footer a{display:inline-flex;align-items:center;min-height:44px;padding:0 10px}
  @media(max-width:520px){.scorecard-app{padding:8px 6px max(18px,env(safe-area-inset-bottom))}.match-context{justify-content:flex-start;padding-right:78px;text-align:left}.match-context a{right:8px}.opening-setup{grid-template-columns:1fr}.players{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);padding:10px 8px}.individual-score{padding:0 7px;gap:5px}.ledger .row-label{width:94px;min-width:94px;max-width:94px}.ledger th,.ledger td{min-width:53px}.quick-actions{grid-template-columns:1fr 1fr 1fr}.quick-actions button,.details summary{padding:6px 4px;font-size:.69rem}.detail-grid{grid-template-columns:1fr 1fr}}
`;

export const sharedRackLedgerScorecardMarkup = `
  <main class="scorecard-app" data-shared-rack-ledger-scorecard data-primary-scoring>
    <div class="scorecard-status" data-status aria-live="polite">Loading…</div>
    <aside class="sandbox-banner" data-sandbox-banner hidden><strong>SEASON 1 WAR GAMES · THROWAWAY DATA</strong><span>No sign-in or setup required. You are using the production scoring interface against isolated practice data.</span></aside>
    <div class="match-context"><span data-match-context>Loading round and match…</span><a data-switch-match href="/scorecard">Switch match</a></div>
    <section class="perspective" data-perspective aria-label="Practice scoring perspective"><span>Recording for</span><button data-perspective-side="A" type="button" aria-pressed="false">Team A</button><button data-perspective-side="B" type="button" aria-pressed="false">Team B</button></section>

    <section class="opening-setup" data-opening-setup aria-label="Opening game order">
      <div class="opening-copy"><strong>Order</strong><span data-opening-note>Choose before rack 1. Racks 1–3 use this game.</span></div>
      <div class="opening-options"><button class="opening-option" data-opening="8-ball" type="button" aria-pressed="false">8 first</button><button class="opening-option" data-opening="9-ball" type="button" aria-pressed="false">9 first</button></div>
    </section>

    <section class="team-score" aria-label="Running team score">
      <div class="team-score-label">Running team score</div>
      <div class="team-score-grid">
        <div class="team-block"><span class="team-name" data-team-a-name>Team A</span><strong class="team-points" data-team-score-a>0</strong></div>
        <span class="team-separator">—</span>
        <div class="team-block"><span class="team-name" data-team-b-name>Team B</span><strong class="team-points" data-team-score-b>0</strong></div>
      </div>
    </section>

    <section class="race" aria-label="Current individual race">
      <div class="race-context"><span>Current individual race</span><strong data-race-status>Scheduled</strong></div>
      <div class="players">
        <article class="player"><h2 class="player-name" data-player-a-name>Player A</h2><div class="player-meta" data-player-a-rating>Rating</div><div class="race-target">Race to <b data-target-a>–</b></div></article>
        <div class="individual-score" aria-label="Individual match score"><span data-score-a>0</span><span>—</span><span data-score-b>0</span></div>
        <article class="player"><h2 class="player-name" data-player-b-name>Player B</h2><div class="player-meta" data-player-b-rating>Rating</div><div class="race-target">Race to <b data-target-b>–</b></div></article>
      </div>

      <section class="ledger-panel" aria-label="Rack-by-rack score ledger">
        <header class="ledger-head"><strong>Rack ledger</strong><span class="ledger-state" data-ledger-state>Loading both submissions…</span></header>
        <div class="ledger-scroll" data-ledger-scroll><table class="ledger" data-ledger><thead></thead><tbody></tbody></table></div>
        <div class="ledger-help">ⓘ Tap any rack on your row to edit only that rack.</div>
      </section>
    </section>

    <section class="edit-panel" data-edit-panel hidden aria-live="polite">
      <div class="edit-head"><div><strong>Edit Rack <span data-edit-rack-number>–</span> · <span data-edit-discipline>–</span></strong><span>Change only your team’s submission.</span></div><button class="edit-close" data-edit-close type="button" aria-label="Close rack editor">×</button></div>
      <div class="edit-compare"><div class="edit-value"><span data-edit-own-label>Your submission</span><strong data-edit-own-value>–</strong></div><div class="edit-value"><span data-edit-opponent-label>Other team</span><strong data-edit-opponent-value>–</strong></div></div>
      <div class="edit-actions"><button class="edit-result" data-edit-result="W" type="button">W · Win</button><button class="edit-result" data-result="L" data-edit-result="L" type="button">L · Loss</button></div>
      <p class="edit-note">Later racks stay exactly as entered. Changing this rack clears your team’s confirmation so the corrected score can be confirmed again.</p>
    </section>

    <section class="next-rack" aria-label="Record next rack"><button class="add-rack primary" data-add-rack type="button">Add Rack 1</button><div class="winner-picker" data-winner-picker><button class="winner" data-rack-a data-side="A" type="button">Player A wins</button><button class="winner" data-rack-b data-side="B" type="button">Player B wins</button></div><span hidden data-next-rack>1</span><span hidden data-next-discipline>8-ball</span></section>

    <section class="reconcile" data-reconcile aria-live="polite"><strong data-reconcile-title>Loading both score records…</strong><span data-reconcile-detail></span></section>
    <section class="quick-actions" aria-label="Score controls"><button class="ghost" data-edit-current type="button">Edit Rack</button><details class="details"><summary>Match details</summary><div class="detail-grid"><div class="detail"><span>Opening order</span><strong data-detail-opening>–</strong></div><div class="detail"><span>First break</span><strong data-detail-break>–</strong></div><div class="detail"><span>Match status</span><strong data-detail-status>–</strong></div><div class="detail"><span>Scoring for</span><strong data-detail-team>–</strong></div></div></details><button class="undo ghost" data-undo type="button">Undo Last Rack</button></section>
    <section class="completion-actions"><button class="confirm" data-confirm type="button">Confirm this side</button><button class="finalize danger" data-finalize type="button">Finalize match</button></section>

    <section class="sandbox-footer" data-sandbox-footer hidden><strong>Practice feedback</strong><p>Tell us what was confusing while it is fresh.</p><textarea data-sandbox-feedback placeholder="What was confusing?"></textarea><div class="sandbox-footer-actions"><button data-save-feedback type="button">Save feedback on this device</button><a href="/demo">Review the full Season 1 Test Drive</a></div></section>
  </main>
  <div class="error-popup" data-error role="alert"><strong>Couldn’t complete that action</strong><span data-error-message></span></div>
`;

export const sharedRackLedgerScorecardControllerSource = String.raw`
  (function(){
    const adapter=window.fdRackLedgerAdapter;
    if(!adapter)throw new Error('Rack ledger scoring adapter is required');
    const statusEl=document.querySelector('[data-status]');const rackAButton=document.querySelector('[data-rack-a]');const rackBButton=document.querySelector('[data-rack-b]');const addRackButton=document.querySelector('[data-add-rack]');const winnerPicker=document.querySelector('[data-winner-picker]');const undoButton=document.querySelector('[data-undo]');const confirmButton=document.querySelector('[data-confirm]');const finalizeButton=document.querySelector('[data-finalize]');const openingSetup=document.querySelector('[data-opening-setup]');const openingButtons=[...document.querySelectorAll('[data-opening]')];const openingNote=document.querySelector('[data-opening-note]');const ledger=document.querySelector('[data-ledger]');const ledgerScroll=document.querySelector('[data-ledger-scroll]');const reconcileEl=document.querySelector('[data-reconcile]');const editPanel=document.querySelector('[data-edit-panel]');const editClose=document.querySelector('[data-edit-close]');const editResultButtons=[...document.querySelectorAll('[data-edit-result]')];const errorPopup=document.querySelector('[data-error]');const perspectiveEl=document.querySelector('[data-perspective]');const perspectiveButtons=[...document.querySelectorAll('[data-perspective-side]')];
    let currentScorecard=null;let currentComparison=null;let currentContext=null;let refreshTimer=null;let editingRackNumber=null;let ledgerRestoreLeft=null;let lastOwnSignature=null;let scoringTeamId=adapter.scoringTeamId();let scoringTeamName=adapter.scoringTeamName();
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||''}
    function setText(selector,value){const node=document.querySelector(selector);if(node)node.textContent=value==null||value===''?'–':String(value)}
    function showError(message){document.querySelector('[data-error-message]').textContent=message;errorPopup.dataset.open='true';clearTimeout(showError.timer);showError.timer=setTimeout(()=>{errorPopup.dataset.open='false'},6500)}
    function ratingText(rating,status){return[rating||'Unrated',status||'unverified'].join(' · ')}
    function sideName(side){if(!currentScorecard)return side;return side==='A'?currentScorecard.player_a_display_name:currentScorecard.player_b_display_name}
    function oppositeSide(side){return side==='A'?'B':'A'}
    function oppositeGame(game){return game==='9-ball'?'8-ball':'9-ball'}
    function gameForRack(number){if(!currentScorecard)return'–';return Number(number)<=Number(currentScorecard.opening_block_length||3)?currentScorecard.opening_discipline:oppositeGame(currentScorecard.opening_discipline)}
    function winnerSide(rack){return rack&&(rack.winnerSide||rack.winner_side)||null}
    function rackGame(rack,number){return rack&&rack.discipline||gameForRack(number)}
    function renderOpeningChoice(selected,locked){openingSetup.dataset.locked=String(locked);for(const button of openingButtons){button.setAttribute('aria-pressed',String(button.dataset.opening===selected));button.disabled=locked}openingNote.textContent=locked?'Order locked after rack 1 · '+(selected==='9-ball'?'9-ball first':'8-ball first'):'Choose before rack 1. Racks 1–3 use this game.';setText('[data-detail-opening]',selected==='9-ball'?'9-ball first':'8-ball first')}
    function rackState(own,opponent,number){if(!own&&!opponent)return'unplayed';if(!own||!opponent)return'pending';return winnerSide(own)===winnerSide(opponent)&&rackGame(own,number)===rackGame(opponent,number)?'matched':'mismatch'}
    function reconciledScore(comparison){let a=0,b=0;const own=comparison.own_racks||[];const opponent=comparison.opponent_racks||[];const count=Math.max(own.length,opponent.length);for(let i=0;i<count;i+=1){if(rackState(own[i],opponent[i],i+1)!=='matched')continue;const side=winnerSide(own[i]);if(side==='A')a+=1;if(side==='B')b+=1}return[a,b]}
    function trackerSide(){return currentComparison?.tracker_player_id===currentScorecard?.player_a_id?'A':'B'}
    function rowHistoryForPlayer(playerId){const own=currentComparison?.own_racks||[];const opponent=currentComparison?.opponent_racks||[];return currentComparison?.tracker_player_id===playerId?own:opponent}
    function cellValue(rack,playerSide){if(!rack)return'—';return winnerSide(rack)===playerSide?'W':'L'}
    function appendCell(row,rack,playerSide,state,number,name,editable){const cell=document.createElement('td');cell.className='submission';const value=cellValue(rack,playerSide);const canAnswerPending=editable&&!rack&&state==='pending';cell.dataset.value=value;cell.dataset.state=state;cell.setAttribute('aria-label','Rack '+number+', '+gameForRack(number)+', '+name+': '+(value==='—'?'no submission':value==='W'?'win':'loss')+', '+state);if(editable&&(rack||canAnswerPending)){const button=document.createElement('button');button.className='rack-edit';button.type='button';button.textContent=rack?value:'+';button.dataset.editRack=String(number);button.dataset.pending=String(canAnswerPending);button.setAttribute('aria-label',canAnswerPending?'Answer rack '+number+' waiting for your team':'Edit '+name+' rack '+number+', currently '+(value==='W'?'win':'loss'));cell.append(button)}else{cell.textContent=value}row.append(cell)}
    function appendStatusCell(row,state,number){const cell=document.createElement('td');cell.className='rack-status';cell.dataset.state=state;cell.textContent=state==='matched'?'✓':state==='mismatch'?'⚠':state==='pending'?'…':'—';cell.setAttribute('aria-label','Rack '+number+' '+state);row.append(cell)}
    function renderLedger(){if(!currentScorecard||!currentComparison)return;const own=currentComparison.own_racks||[];const opponent=currentComparison.opponent_racks||[];const locked=['finalized','corrected'].includes(currentScorecard.status);const played=Math.max(own.length,opponent.length);const columns=Math.max(1,played+(locked?0:1));const head=ledger.querySelector('thead');const body=ledger.querySelector('tbody');head.replaceChildren();body.replaceChildren();const headerRow=document.createElement('tr');const blank=document.createElement('th');blank.className='row-label rack-head';blank.scope='col';blank.textContent='Player';headerRow.append(blank);for(let number=1;number<=columns;number+=1){const state=rackState(own[number-1],opponent[number-1],number);const th=document.createElement('th');th.className='rack-head';th.dataset.state=state;th.scope='col';const n=document.createElement('span');n.className='rack-number';n.textContent='R'+number;const game=document.createElement('span');game.className='game-chip';game.textContent=gameForRack(number)==='9-ball'?'9':'8';game.setAttribute('aria-label',gameForRack(number));th.append(n,game);headerRow.append(th)}head.append(headerRow);const rows=[['A',currentScorecard.player_a_id,currentScorecard.player_a_display_name],['B',currentScorecard.player_b_id,currentScorecard.player_b_display_name]];for(const item of rows){const side=item[0],playerId=item[1],name=item[2];const row=document.createElement('tr');const label=document.createElement('th');label.className='row-label';label.scope='row';label.textContent=name;row.append(label);const history=rowHistoryForPlayer(playerId);const editable=currentComparison.tracker_player_id===playerId&&!locked&&!currentComparison.own_confirmed_at;for(let i=0;i<columns;i+=1){appendCell(row,history[i],side,rackState(own[i],opponent[i],i+1),i+1,name,editable)}body.append(row)}const statusRow=document.createElement('tr');const statusLabel=document.createElement('th');statusLabel.className='row-label';statusLabel.scope='row';statusLabel.textContent='Status';statusRow.append(statusLabel);const mismatches=[];let pending=0;for(let i=0;i<columns;i+=1){const state=rackState(own[i],opponent[i],i+1);appendStatusCell(statusRow,state,i+1);if(state==='mismatch')mismatches.push(i+1);if(state==='pending')pending+=1}body.append(statusRow);setText('[data-ledger-state]',mismatches.length?mismatches.length+' rack'+(mismatches.length===1?'':'s')+' need attention':pending?pending+' pending submission'+(pending===1?'':'s'):'Both sides aligned');requestAnimationFrame(()=>{if(ledgerRestoreLeft!=null){ledgerScroll.scrollLeft=ledgerRestoreLeft;ledgerRestoreLeft=null}else{ledgerScroll.scrollLeft=ledgerScroll.scrollWidth}})}
    function renderScorecard(scorecard){currentScorecard=scorecard;setText('[data-player-a-name]',scorecard.player_a_display_name);setText('[data-player-b-name]',scorecard.player_b_display_name);setText('[data-player-a-rating]',ratingText(scorecard.player_a_fargo_rating,scorecard.player_a_rating_status));setText('[data-player-b-rating]',ratingText(scorecard.player_b_fargo_rating,scorecard.player_b_rating_status));setText('[data-target-a]',scorecard.race_to_a);setText('[data-target-b]',scorecard.race_to_b);setText('[data-race-status]',scorecard.status);setText('[data-detail-break]',sideName(scorecard.first_break));setText('[data-detail-status]',scorecard.status);setText('[data-detail-team]',scoringTeamName);renderOpeningChoice(scorecard.opening_discipline||'8-ball',false)}
    function renderContext(context){currentContext=context||null;if(!context){setText('[data-match-context]','Current player match');return}setText('[data-match-context]','Round '+context.round_number+' • Match '+context.match_number+' of '+context.match_count);setText('[data-team-a-name]',context.team_a_name);setText('[data-team-b-name]',context.team_b_name);setText('[data-team-score-a]',context.team_score_a);setText('[data-team-score-b]',context.team_score_b)}
    function renderComparison(comparison){currentComparison=comparison;const locked=currentScorecard&&['finalized','corrected'].includes(currentScorecard.status);const own=comparison.own_racks||[];const opponent=comparison.opponent_racks||[];const started=own.length>0||opponent.length>0;renderOpeningChoice(currentScorecard?.opening_discipline||'8-ball',locked||started);const score=reconciledScore(comparison);setText('[data-score-a]',score[0]);setText('[data-score-b]',score[1]);renderLedger();const nextRack=own.length+1;setText('[data-next-rack]',nextRack);setText('[data-next-discipline]',gameForRack(nextRack));const raceA=Number(score[0]||0);const raceB=Number(score[1]||0);const targetA=Number(currentScorecard.race_to_a||currentScorecard.raceToA||0);const targetB=Number(currentScorecard.race_to_b||currentScorecard.raceToB||0);const raceHint=(targetA||targetB)?(' · race '+raceA+'-'+raceB):'';addRackButton.textContent='Rack '+nextRack+' · '+gameForRack(nextRack)+raceHint;addRackButton.setAttribute('aria-label','Record rack '+nextRack+' for '+gameForRack(nextRack)+'. Score '+raceA+' to '+raceB+'.');rackAButton.textContent=currentScorecard.player_a_display_name+' wins';rackBButton.textContent=currentScorecard.player_b_display_name+' wins';if(comparison.histories_match){reconcileEl.dataset.state='match';setText('[data-reconcile-title]',comparison.both_confirmed?'Scores match · both confirmed':'Scores match');setText('[data-reconcile-detail]',comparison.ready_to_finalize?'Ready to finalize':'Waiting for both confirmations')}else{reconcileEl.dataset.state='mismatch';setText('[data-reconcile-title]',comparison.mismatch_rack_number?'Mismatch at rack '+comparison.mismatch_rack_number:'Waiting for the other team');setText('[data-reconcile-detail]',comparison.mismatch_rack_number?'Both teams submitted different winners for this rack. Agree on the table result, then one side undoes and re-enters.':'Each team records its own W/L. Matched racks show ✓. Mismatches show ⚠ until you agree.')}addRackButton.disabled=locked||Boolean(comparison.own_confirmed_at);rackAButton.disabled=addRackButton.disabled;rackBButton.disabled=addRackButton.disabled;undoButton.disabled=locked||Boolean(comparison.own_confirmed_at)||!own.length;confirmButton.disabled=locked||Boolean(comparison.own_confirmed_at)||!own.length;finalizeButton.disabled=locked||!comparison.ready_to_finalize;if(editingRackNumber&&!own[editingRackNumber-1]&&!(opponent[editingRackNumber-1]&&editingRackNumber===own.length+1))closeRackEditor()}
    function renderPerspective(){const perspectives=adapter.perspectives||[];if(!perspectives.length){perspectiveEl.dataset.open='false';return}perspectiveEl.dataset.open='true';const current=adapter.perspective();for(const button of perspectiveButtons){const info=perspectives.find(item=>item.side===button.dataset.perspectiveSide);if(info)button.textContent=info.name;button.setAttribute('aria-pressed',String(button.dataset.perspectiveSide===current))}}
    async function loadAll({quiet=false}={}){if(!quiet)setStatus(adapter.mode==='sandbox'?'Loading practice…':'Loading…');const result=await adapter.load();renderScorecard(result.scorecard);renderContext(result.context);renderComparison(result.comparison);scoringTeamId=adapter.scoringTeamId();scoringTeamName=adapter.scoringTeamName();setText('[data-detail-team]',scoringTeamName);renderPerspective();const signature=JSON.stringify(result.comparison.own_racks||[]);if(quiet&&lastOwnSignature!=null&&signature!==lastOwnSignature)setStatus('Score updated on another device','ok');else if(!quiet)setStatus(adapter.mode==='sandbox'?'Practice · production scorer':'Live','ok');lastOwnSignature=signature}
    async function chooseOpeningDiscipline(openingDiscipline){setStatus('Saving game order…');await adapter.setOpeningDiscipline({openingDiscipline,scoringTeamId});await loadAll();setStatus((openingDiscipline==='9-ball'?'9-ball':'8-ball')+' will be played first.','ok')}
    async function recordRack(winner){setStatus('Saving rack…');const nextRack=(currentComparison?.own_racks||[]).length+1;await adapter.saveRack({winnerSide:winner,scoringTeamId,discipline:gameForRack(nextRack)});winnerPicker.dataset.open='false';await loadAll()}
    async function updateRack(rackNumber,result){const side=trackerSide();const winner=result==='W'?side:oppositeSide(side);const own=currentComparison?.own_racks||[];const existing=Boolean(own[rackNumber-1]);ledgerRestoreLeft=ledgerScroll.scrollLeft;setStatus((existing?'Updating':'Answering')+' rack '+rackNumber+'…');const body=existing?{rackNumber,winnerSide:winner,scoringTeamId}:{winnerSide:winner,scoringTeamId};body.discipline=gameForRack(rackNumber);await adapter.saveRack(body);closeRackEditor();await loadAll();setStatus('Rack '+rackNumber+' updated','ok')}
    async function undoRack(){setStatus('Undoing rack…');await adapter.undo({scoringTeamId});await loadAll()}
    async function confirmScore(){setStatus('Confirming score…');await adapter.confirm({scoringTeamId});await loadAll()}
    async function finalizeMatch(){setStatus('Finalizing match…');await adapter.finalize({scoringTeamId});await loadAll();setStatus(adapter.mode==='sandbox'?'Practice finalized':'Finalized','ok')}
    function openRackEditor(number){if(!currentComparison||!currentScorecard)return;const own=currentComparison.own_racks||[];const opponent=currentComparison.opponent_racks||[];const ownRack=own[number-1];const opponentRack=opponent[number-1];const answeringPending=!ownRack&&Boolean(opponentRack)&&number===own.length+1;if((!ownRack&&!answeringPending)||currentComparison.own_confirmed_at||['finalized','corrected'].includes(currentScorecard.status))return;editingRackNumber=number;const side=trackerSide();const otherSide=oppositeSide(side);setText('[data-edit-rack-number]',number);setText('[data-edit-discipline]',gameForRack(number));setText('[data-edit-own-label]',sideName(side)+' · your team');setText('[data-edit-own-value]',answeringPending?'—':cellValue(ownRack,side));setText('[data-edit-opponent-label]',sideName(otherSide)+' · other team');setText('[data-edit-opponent-value]',cellValue(opponentRack,otherSide));for(const button of editResultButtons)button.setAttribute('aria-pressed',String(!answeringPending&&button.dataset.editResult===cellValue(ownRack,side)));editPanel.hidden=false;editPanel.scrollIntoView({block:'nearest',behavior:'smooth'})}
    function closeRackEditor(){editingRackNumber=null;editPanel.hidden=true}
    async function run(action){try{await action()}catch(error){if(error.message.includes('Score changed on another device')){winnerPicker.dataset.open='false';closeRackEditor();await loadAll({quiet:true});setStatus('Score changed on another phone','error');showError('Score changed on another phone. We refreshed it—check the current rack before scoring.');return}setStatus('Action failed','error');showError(error.message)}}
    function startRefresh(){clearInterval(refreshTimer);if(adapter.liveRefresh===false)return;refreshTimer=setInterval(()=>{if(document.visibilityState==='visible'&&!editingRackNumber)run(()=>loadAll({quiet:true}))},3000)}
    for(const button of openingButtons)button.addEventListener('click',()=>run(()=>chooseOpeningDiscipline(button.dataset.opening)));
    addRackButton.addEventListener('click',()=>{winnerPicker.dataset.open=winnerPicker.dataset.open==='true'?'false':'true'});
    rackAButton.addEventListener('click',()=>run(()=>recordRack('A')));rackBButton.addEventListener('click',()=>run(()=>recordRack('B')));
    ledger.addEventListener('click',(event)=>{const button=event.target.closest('[data-edit-rack]');if(button)openRackEditor(Number(button.dataset.editRack))});
    editClose.addEventListener('click',closeRackEditor);for(const button of editResultButtons)button.addEventListener('click',()=>{if(editingRackNumber)run(()=>updateRack(editingRackNumber,button.dataset.editResult))});
    document.querySelector('[data-edit-current]').addEventListener('click',()=>{const own=currentComparison?.own_racks||[];if(own.length)openRackEditor(own.length)});
    undoButton.addEventListener('click',()=>run(undoRack));confirmButton.addEventListener('click',()=>run(confirmScore));finalizeButton.addEventListener('click',()=>run(finalizeMatch));
    for(const button of perspectiveButtons)button.addEventListener('click',()=>run(async()=>{if(!adapter.setPerspective)return;await adapter.setPerspective(button.dataset.perspectiveSide);scoringTeamId=adapter.scoringTeamId();scoringTeamName=adapter.scoringTeamName();closeRackEditor();winnerPicker.dataset.open='false';lastOwnSignature=null;await loadAll()}));
    const switchLink=document.querySelector('[data-switch-match]');switchLink.href=adapter.switchHref||'/scorecard';switchLink.textContent=adapter.switchLabel||'Switch match';
    if(adapter.mode==='sandbox'){document.querySelector('[data-sandbox-banner]').hidden=false;document.querySelector('[data-sandbox-footer]').hidden=false;const feedback=document.querySelector('[data-sandbox-feedback]');try{feedback.value=localStorage.getItem('fd.sandboxFeedback.player.v1')||''}catch{}document.querySelector('[data-save-feedback]').addEventListener('click',()=>{try{localStorage.setItem('fd.sandboxFeedback.player.v1',feedback.value);setStatus('Practice feedback saved on this device','ok')}catch{setStatus('Could not save feedback','error')}})}
    run(loadAll);startRefresh();
  })();
`;

export function renderRackLedgerScorecardPage({
  title = 'Fremont Derby Scorecard',
  adapterSource,
} = {}) {
  if (!adapterSource) throw new Error('adapterSource is required');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>${sharedRackLedgerScorecardStyles}</style>
</head>
<body>
${sharedRackLedgerScorecardMarkup}
<script>${adapterSource}</script>
<script>${sharedRackLedgerScorecardControllerSource}</script>
</body>
</html>`;
}
