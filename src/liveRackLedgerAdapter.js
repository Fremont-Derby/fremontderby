export const liveRackLedgerAdapterSource = String.raw`
  (function(){
    const params=new URLSearchParams(location.search);
    const matchId=params.get('match')||'';
    const scoringTeamId=params.get('team')||'';
    const scoringTeamName=params.get('teamName')||'your team';
    let expectedOwnRacks=[];

    function accessToken(){return sessionStorage.getItem('fd.accessToken')||''}
    function showSignInRecovery(){
      const context=document.querySelector('[data-match-context]');
      if(context)context.innerHTML='<a href="/profile">Open Profile to sign in</a>';
    }
    function requireContext(){
      const token=accessToken();
      if(!matchId)throw new Error('Choose a match from the scorecard list.');
      if(!scoringTeamId)throw new Error('Choose which team you are scoring for.');
      if(!token){showSignInRecovery();throw new Error('Sign in with Google to score this match.')}
      return{matchId,scoringTeamId,token};
    }
    function retryAfterSeconds(response){
      const value=response.headers?.get('retry-after');
      const numeric=Number(value);
      if(value&&Number.isFinite(numeric)&&numeric>0)return Math.min(Math.ceil(numeric),120);
      const date=value&&Date.parse(value);
      if(date&&Number.isFinite(date))return Math.min(Math.max(Math.ceil((date-Date.now())/1000),1),120);
      return 15;
    }
    async function api(path,options={}){
      const inputs=requireContext();
      const base=path.replace(':id',encodeURIComponent(inputs.matchId));
      const separator=base.includes('?')?'&':'?';
      const contextualPath=base+separator+'scoringTeamId='+encodeURIComponent(inputs.scoringTeamId);
      const response=await fetch(contextualPath,{...options,headers:{authorization:'Bearer '+inputs.token,'content-type':'application/json',...(options.headers||{})}});
      let body={};
      try{body=await response.json()}catch{}
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');showSignInRecovery();throw new Error('Your sign-in expired. Open Profile and sign in again.')}
      if(response.status===429){
        const seconds=retryAfterSeconds(response);
        const failure=new Error('Too many requests. Wait '+seconds+' seconds, then check the latest rack before retrying.');
        failure.status=429;
        failure.retryAfterSeconds=seconds;
        throw failure;
      }
      if(!response.ok){
        const message=body.error||'Request failed';
        if(message==='Score record is already complete'){
          throw new Error('Your side already reached the race target. Submit it now, or edit/undo a rack if your score is wrong.');
        }
        const failure=new Error(message);
        failure.status=response.status;
        throw failure;
      }
      return body;
    }

    window.fdRackLedgerAdapter={
      mode:'live',
      liveRefresh:true,
      switchHref:'/scorecard',
      switchLabel:'Switch match',
      scoringTeamId(){return scoringTeamId},
      scoringTeamName(){return scoringTeamName},
      async load(){
        requireContext();
        const[scoreBody,comparisonBody]=await Promise.all([
          api('/api/player-matches/:id/scorecard',{method:'GET'}),
          api('/api/player-matches/:id/score-comparison',{method:'GET'}),
        ]);
        const scorecard=scoreBody.scorecard;
        const comparison=comparisonBody.comparison;
        expectedOwnRacks=Array.isArray(comparison?.own_racks)?comparison.own_racks:[];
        const opponentRacks=Array.isArray(comparison?.opponent_racks)?comparison.opponent_racks:[];
        const ownSide=comparison?.tracker_player_id===scorecard?.player_a_id?'A':comparison?.tracker_player_id===scorecard?.player_b_id?'B':null;
        window.fdRackLedgerState={
          ownSide,
          ownConfirmed:Boolean(comparison?.own_confirmed_at),
          ownRackCount:expectedOwnRacks.length,
          opponentRackCount:opponentRacks.length,
          historiesMatch:Boolean(comparison?.histories_match),
          mismatchRackNumber:Number(comparison?.mismatch_rack_number||0)||null,
          locked:['finalized','corrected'].includes(scorecard?.status),
        };
        return{scorecard,context:comparisonBody.context,comparison};
      },
      async setOpeningDiscipline({openingDiscipline}){
        return api('/api/player-matches/:id/score-racks',{method:'POST',body:JSON.stringify({openingDiscipline,scoringTeamId})});
      },
      async saveRack(input){
        const body={scoringTeamId,winnerSide:input.winnerSide,expectedRacks:expectedOwnRacks};
        if(input.rackNumber!=null)body.rackNumber=input.rackNumber;
        return api('/api/player-matches/:id/score-racks',{method:'POST',body:JSON.stringify(body)});
      },
      async undo(){return api('/api/player-matches/:id/score-racks/undo',{method:'POST',body:JSON.stringify({scoringTeamId,expectedRacks:expectedOwnRacks})})},
      async confirm(){return api('/api/player-matches/:id/score-confirm',{method:'POST',body:JSON.stringify({scoringTeamId,expectedRacks:expectedOwnRacks})})},
      async finalize(){return api('/api/player-matches/:id/finalize-reconciled',{method:'POST',body:JSON.stringify({scoringTeamId})})},
    };
  })();
`;
