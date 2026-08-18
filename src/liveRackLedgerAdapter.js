export const liveRackLedgerAdapterSource = String.raw`
  (function(){
    const params=new URLSearchParams(location.search);
    const matchId=params.get('match')||'';
    const scoringTeamId=params.get('team')||'';
    const scoringTeamName=params.get('teamName')||'your team';

    function accessToken(){return sessionStorage.getItem('fd.accessToken')||''}
    function isOpenAuthLane(){const h=String(location.hostname||'');return h.startsWith('dru.')||h.startsWith('jfl.')||h.startsWith('gamma.');}
    function showSignInRecovery(){
      const context=document.querySelector('[data-match-context]');
      if(context)context.innerHTML='<a href="/profile">Open Profile to sign in</a>';
    }
    function setTransportHint(message){
      const status=document.querySelector('[data-status]');
      if(!status||!message)return;
      status.textContent=message;
      status.dataset.tone='error';
    }
    function requireContext(){
      const token=accessToken();
      if(!matchId)throw new Error('Choose a match from the scorecard list.');
      if(!scoringTeamId)throw new Error('Choose which team you are scoring for.');
      if(!token&&!isOpenAuthLane()){showSignInRecovery();throw new Error('Sign in with Google to score this match.')}
      return{matchId,scoringTeamId,token};
    }
    async function api(path,options={},attempt=0){
      if(typeof navigator!=='undefined'&&navigator.onLine===false){
        setTransportHint('You are offline. Reconnect, then try again — the last saved racks are still on the server.');
        throw new Error('You are offline. Check your connection and try again.');
      }
      const inputs=requireContext();
      const base=path.replace(':id',encodeURIComponent(inputs.matchId));
      const separator=base.includes('?')?'&':'?';
      const contextualPath=base+separator+'scoringTeamId='+encodeURIComponent(inputs.scoringTeamId);
      let response;
      try{
        response=await fetch(contextualPath,{...options,headers:{...(inputs.token?{authorization:'Bearer '+inputs.token}:{}), 'content-type':'application/json',...(options.headers||{})}});
      }catch(error){
        if(attempt<1){
          await new Promise((resolve)=>setTimeout(resolve,450));
          return api(path,options,attempt+1);
        }
        setTransportHint('Network error scoring this match. Your last successful save is on the server — retry when the signal is back.');
        throw new Error('Network error. Retry in a moment.');
      }
      let body={};
      try{body=await response.json()}catch{}
      if(response.status===401){sessionStorage.removeItem('fd.accessToken');showSignInRecovery();throw new Error('Your sign-in expired. Open Profile and sign in again.')}
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }

    window.addEventListener('offline',()=>setTransportHint('Offline — rack taps will not save until you reconnect.'));
    window.addEventListener('online',()=>{
      const status=document.querySelector('[data-status]');
      if(status&&/offline|network error/i.test(status.textContent||'')){
        status.textContent='Back online. Refreshing scorecard…';
        status.dataset.tone='ok';
      }
    });

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
        return{scorecard:scoreBody.scorecard,context:comparisonBody.context,comparison:comparisonBody.comparison};
      },
      async setOpeningDiscipline({openingDiscipline}){
        return api('/api/player-matches/:id/score-racks',{method:'POST',body:JSON.stringify({openingDiscipline,scoringTeamId})});
      },
      async saveRack(input){
        const body={scoringTeamId,winnerSide:input.winnerSide};
        if(input.rackNumber!=null)body.rackNumber=input.rackNumber;
        return api('/api/player-matches/:id/score-racks',{method:'POST',body:JSON.stringify(body)});
      },
      async undo(){return api('/api/player-matches/:id/score-racks/undo',{method:'POST',body:JSON.stringify({scoringTeamId})})},
      async confirm(){return api('/api/player-matches/:id/score-confirm',{method:'POST',body:JSON.stringify({scoringTeamId})})},
      async finalize(){return api('/api/player-matches/:id/finalize-reconciled',{method:'POST',body:JSON.stringify({scoringTeamId})})},
    };
  })();
`;
