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
    async function api(path,options={}){
      const inputs=requireContext();
      const base=path.replace(':id',encodeURIComponent(inputs.matchId));
      const separator=base.includes('?')?'&':'?';
      const contextualPath=base+separator+'scoringTeamId='+encodeURIComponent(inputs.scoringTeamId);
      const response=await fetch(contextualPath,{...options,headers:{authorization:'Bearer '+inputs.token,'content-type':'application/json',...(options.headers||{})}});
      let body={};
      try{body=await response.json()}catch{}
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');showSignInRecovery();throw new Error('Your sign-in expired. Open Profile and sign in again.')}
      if(!response.ok)throw new Error(body.error||'Request failed');
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
        const ownSide=comparison?.tracker_player_id===scorecard?.player_a_id?'A':comparison?.tracker_player_id===scorecard?.player_b_id?'B':null;
        window.fdRackLedgerState={
          ownSide,
          ownConfirmed:Boolean(comparison?.own_confirmed_at),
          ownRackCount:expectedOwnRacks.length,
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
