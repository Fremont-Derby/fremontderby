import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { sharedRackLedgerScorecardControllerSource as source } from '../src/rackLedgerScorecard.js';

function harness(load) {
  const nodes=new Map(), intervals=[]; let sessionChanged, now=0, current=true;
  function element(){return {dataset:{},hidden:true,disabled:false,textContent:'',children:[],listeners:{},setAttribute(){},append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},addEventListener(name,fn){this.listeners[name]=fn},querySelector:node,querySelectorAll(){return []},scrollIntoView(){}};}
  function node(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);}
  const buttons=['[data-rack-a]','[data-rack-b]','[data-add-rack]','[data-undo]','[data-confirm]','[data-finalize]'].map(node);
  node('[data-shared-rack-ledger-scorecard]').querySelectorAll=()=>buttons;
  const adapter={mode:'live',load,scoringTeamId:()=> 'team',scoringTeamName:()=> 'Team',onSessionChanged(fn){sessionChanged=fn},isSessionCurrent:()=>current};
  vm.runInNewContext(source,{window:{fdRackLedgerAdapter:adapter},document:{querySelector:node,querySelectorAll:()=>[],createElement:element,visibilityState:'visible'},setTimeout:()=>1,clearTimeout(){},setInterval(fn,ms){intervals.push({fn,ms});return 1},clearInterval(){},requestAnimationFrame:fn=>fn(),Date:{now:()=>now}});
  return {node,buttons,intervals,adapter,invalidate(){current=false;sessionChanged()},tick(ms){now+=ms;intervals[0].fn()}};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
const result=()=>({scorecard:{player_a_id:'a',player_b_id:'b',player_a_display_name:'Private Alice',player_b_display_name:'Private Bob',status:'playing'},comparison:{own_racks:[],opponent_racks:[],tracker_player_id:'a',histories_match:true},context:null});

test('session change clears private names, racks and editing controls immediately',async()=>{
 const h=harness(async()=>result());await flush();
 assert.equal(h.node('[data-player-a-name]').textContent,'Private Alice');
 assert.ok(h.node('tbody').children.length);
 h.invalidate();
 assert.equal(h.node('[data-player-a-name]').textContent,'–');
 assert.equal(h.node('tbody').children.length,0);
 assert.ok(h.buttons.every(b=>b.disabled));
 assert.equal(h.node('[data-load-title]').textContent,'Your sign-in changed');
 assert.equal(h.node('[data-shared-rack-ledger-scorecard]').dataset.loadState,'unavailable');
});
test('late old-session load cannot redisplay private score state',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>{resolve=r}));h.invalidate();resolve(result());await flush();
 assert.equal(h.node('[data-player-a-name]').textContent,'–');assert.ok(h.buttons.every(b=>b.disabled));
 assert.equal(h.node('[data-load-recovery]').hidden,false);
});
test('background refresh serializes pending loads and honors 429 cooldown',async()=>{
 let calls=0, reject;const h=harness(()=>{calls++;return calls===1?Promise.resolve(result()):new Promise((_,r)=>{reject=r})});await flush();
 assert.equal(h.intervals[0].ms,15000);h.tick(15000);assert.equal(calls,2);h.tick(15000);assert.equal(calls,2);
 reject(Object.assign(new Error('Wait'),{status:429,retryAfterSeconds:60}));await flush();h.tick(15000);assert.equal(calls,2);h.tick(45000);assert.equal(calls,3);
});
test('initial forbidden load offers supported picker recovery and no score editor',async()=>{
 const h=harness(async()=>{throw Object.assign(new Error('Forbidden'),{status:403})});await flush();
 assert.equal(h.node('[data-load-title]').textContent,'This scorecard link is unavailable');
 assert.equal(h.node('[data-shared-rack-ledger-scorecard]').dataset.loadState,'unavailable');
 assert.equal(h.node('[data-load-recovery]').hidden,false);
});
