import { raceTargets } from '../domain/match.js';

export const playerSandboxFixture = {
  players: {
    A: { id: 'sandbox-player-a', name: 'Maya Banks', rating: 525 },
    B: { id: 'sandbox-player-b', name: 'Eli Torres', rating: 475 },
  },
  teams: {
    A: { id: 'sandbox-team-a', name: 'Break Room Bandits' },
    B: { id: 'sandbox-team-b', name: 'Golden Rail' },
  },
  chart: [
    { maxDiff: 49, strongerTo: 5, weakerTo: 5 },
    { maxDiff: 99, strongerTo: 5, weakerTo: 4 },
    { maxDiff: 9999, strongerTo: 6, weakerTo: 4 },
  ],
  openingBlockLength: 3,
};

export function sandboxRackLedgerAdapterSource() {
  const targets = raceTargets(
    playerSandboxFixture.players.A.rating,
    playerSandboxFixture.players.B.rating,
    playerSandboxFixture.chart,
  );
  const fixture = {
    ...playerSandboxFixture,
    targets,
  };

  return String.raw`
    (function(){
      const fixture=${JSON.stringify(fixture)};
      const storageKey='fd.playerSandbox.v1';
      function fresh(){return{perspective:'A',openingDiscipline:'8-ball',A:{racks:[],confirmed:false},B:{racks:[],confirmed:false},finalized:false}}
      function read(){try{const value=JSON.parse(sessionStorage.getItem(storageKey));return value&&value.A&&value.B?value:fresh()}catch{return fresh()}}
      let state=read();
      function persist(){sessionStorage.setItem(storageKey,JSON.stringify(state))}
      function team(side){return fixture.teams[side]}
      function player(side){return fixture.players[side]}
      function ownSide(){return state.perspective}
      function otherSide(){return ownSide()==='A'?'B':'A'}
      function sameRack(a,b){return Boolean(a&&b&&a.winnerSide===b.winnerSide&&a.discipline===b.discipline)}
      function historiesMatch(){const a=state.A.racks,b=state.B.racks;return a.length>0&&a.length===b.length&&a.every((rack,index)=>sameRack(rack,b[index]))}
      function mismatchRack(){const a=state.A.racks,b=state.B.racks;const count=Math.min(a.length,b.length);for(let i=0;i<count;i+=1){if(!sameRack(a[i],b[i]))return i+1}return null}
      function rackScore(racks){let a=0,b=0;for(const rack of racks){if(rack.winnerSide==='A')a+=1;if(rack.winnerSide==='B')b+=1}return{a,b}}
      function historyComplete(racks){const score=rackScore(racks);return score.a>=fixture.targets.a||score.b>=fixture.targets.b}
      function status(){return state.finalized?'finalized':state.A.racks.length||state.B.racks.length?'in_progress':'scheduled'}
      function comparison(){const side=ownSide(),other=otherSide();const own=state[side],opponent=state[other];const both=state.A.confirmed&&state.B.confirmed;return{
        tracker_player_id:player(side).id,
        own_racks:structuredClone(own.racks),
        opponent_racks:structuredClone(opponent.racks),
        own_confirmed_at:own.confirmed?'sandbox-confirmed':null,
        opponent_confirmed_at:opponent.confirmed?'sandbox-confirmed':null,
        histories_match:historiesMatch(),
        both_confirmed:both,
        ready_to_finalize:historiesMatch()&&both&&historyComplete(state.A.racks)&&historyComplete(state.B.racks),
        mismatch_rack_number:mismatchRack(),
      }}
      function scorecard(){return{
        player_a_id:fixture.players.A.id,
        player_b_id:fixture.players.B.id,
        player_a_display_name:fixture.players.A.name,
        player_b_display_name:fixture.players.B.name,
        player_a_fargo_rating:fixture.players.A.rating,
        player_b_fargo_rating:fixture.players.B.rating,
        player_a_rating_status:'practice',
        player_b_rating_status:'practice',
        race_to_a:fixture.targets.a,
        race_to_b:fixture.targets.b,
        status:status(),
        first_break:'A',
        opening_discipline:state.openingDiscipline,
        opening_block_length:fixture.openingBlockLength,
      }}
      function context(){return{
        round_number:4,
        match_number:3,
        match_count:3,
        team_a_name:fixture.teams.A.name,
        team_b_name:fixture.teams.B.name,
        team_score_a:1,
        team_score_b:1,
      }}
      function requireMutable(){if(state.finalized)throw new Error('Practice match is already finalized')}
      function clearOwnConfirmation(){state[ownSide()].confirmed=false}
      function expectedDiscipline(number){return number<=fixture.openingBlockLength?state.openingDiscipline:(state.openingDiscipline==='8-ball'?'9-ball':'8-ball')}

      window.fdRackLedgerAdapter={
        mode:'sandbox',
        liveRefresh:false,
        switchHref:'/demo',
        switchLabel:'Test Drive home',
        perspectives:[
          {side:'A',name:fixture.teams.A.name},
          {side:'B',name:fixture.teams.B.name},
        ],
        perspective(){return state.perspective},
        scoringTeamId(){return team(ownSide()).id},
        scoringTeamName(){return team(ownSide()).name},
        async setPerspective(side){if(!['A','B'].includes(side))return;state.perspective=side;persist()},
        async load(){return{scorecard:scorecard(),context:context(),comparison:comparison()}},
        async setOpeningDiscipline({openingDiscipline}){
          requireMutable();
          if(state.A.racks.length||state.B.racks.length)throw new Error('Opening discipline is locked after rack 1 is recorded');
          if(!['8-ball','9-ball'].includes(openingDiscipline))throw new Error('openingDiscipline must be 8-ball or 9-ball');
          state.openingDiscipline=openingDiscipline;persist();return{openingDiscipline};
        },
        async saveRack({winnerSide,rackNumber}){
          requireMutable();
          if(!['A','B'].includes(winnerSide))throw new Error('winnerSide must be A or B');
          const side=ownSide(),owned=state[side];
          if(owned.confirmed)throw new Error('Unconfirm this side before changing the score');
          if(rackNumber!=null){
            const index=Number(rackNumber)-1;
            if(!owned.racks[index])throw new Error('Rack is not present in this team score');
            owned.racks[index]={...owned.racks[index],winnerSide};
          }else{
            const number=owned.racks.length+1;
            owned.racks.push({rackNumber:number,discipline:expectedDiscipline(number),winnerSide});
          }
          clearOwnConfirmation();persist();return{rack_number:rackNumber||owned.racks.length,winner_side:winnerSide};
        },
        async undo(){
          requireMutable();const owned=state[ownSide()];if(!owned.racks.length)throw new Error('No rack to undo');owned.racks.pop();clearOwnConfirmation();persist();return{undone:true};
        },
        async confirm(){
          requireMutable();const owned=state[ownSide()];if(!owned.racks.length)throw new Error('Score record must contain at least one rack');owned.confirmed=true;persist();return{confirmed:true};
        },
        async finalize(){
          requireMutable();
          if(!historiesMatch())throw new Error('Both team score records must match before finalization');
          if(!state.A.confirmed||!state.B.confirmed)throw new Error('Both teams must confirm the reconciled score before finalization');
          if(!historyComplete(state.A.racks)||!historyComplete(state.B.racks))throw new Error('Race target has not been reached');
          state.finalized=true;persist();return{status:'finalized'};
        },
      };
    })();
  `;
}
