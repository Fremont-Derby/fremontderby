import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';

function client(fetch) {
  const data = new Map([['fd.accessToken', 'original']]);
  const listeners = new Map();
  const window = { addEventListener(name, listener) { listeners.set(name, listener); } };
  const sessionStorage = { getItem: key => data.get(key), removeItem: key => data.delete(key) };
  vm.runInNewContext(liveRackLedgerAdapterSource, { window, sessionStorage, fetch,
    URLSearchParams, location: { search: '?match=match%20id&team=team%20id', hostname: 'jfl.invalid' },
    document: { querySelector: () => null }, Date, Set });
  return { adapter: window.fdRackLedgerAdapter, switch() { data.set('fd.accessToken', 'new'); listeners.get('fd:session-changed')(); }, data };
}
const actions = [['loadClaim','',undefined], ['claimScore','/claim',{}], ['requestTakeover','/request',{}],
  ['respondTakeover','/respond',{decision:'release'}], ['releaseScore','/release',{}]];

for (const [name, suffix, payload] of actions) {
  test(name + ' binds authenticated team context and returns authoritative claim', async () => {
    let calls = 0;
    const { adapter } = client(async (url, options) => {
      calls++;
      assert.equal(url, '/api/player-matches/match%20id/score-claim'+suffix+'?scoringTeamId=team%20id');
      assert.equal(options.headers.authorization, 'Bearer original');
      assert.equal(options.method, payload ? 'POST' : 'GET');
      if(payload) assert.deepEqual(JSON.parse(options.body), {scoringTeamId:'team id',...payload});
      else assert.equal(options.cache,'no-store');
      return Response.json({claim:{owner:'authoritative'}});
    });
    assert.equal((await adapter[name](payload?.decision)).owner, 'authoritative');
    assert.equal(calls,1);
  });
  test(name + ' never replays an uncertain network failure', async () => {
    let calls=0;
    const {adapter}=client(async()=>{calls++;throw new Error('lost response');});
    await assert.rejects(adapter[name](payload?.decision),/lost response/);
    assert.equal(calls,1);
  });
  for (const status of [200,401,429]) test(name+' rejects delayed old-session body '+status, async()=>{
    let finish, started;
    const reading=new Promise(resolve=>{started=resolve;});
    const c=client(async()=>({status,ok:status===200,json:()=>new Promise(resolve=>{finish=resolve;started();})}));
    const operation=c.adapter[name](payload?.decision);
    await reading;
    c.switch(); finish({claim:{owner:'private old name'}});
    await assert.rejects(operation,error=>error.sessionChanged===true);
    assert.equal(c.data.get('fd.accessToken'),'new');
  });
}

test('claim throttling blocks score and other claim requests without replay',async()=>{
  let calls=0;
  const {adapter}=client(async()=>{calls++;return Response.json({error:'slow'}, {status:429,headers:{'retry-after':'60'}});});
  await assert.rejects(adapter.requestTakeover(),e=>e.status===429&&e.retryAfterSeconds===60);
  await assert.rejects(adapter.claimScore(),e=>e.status===429);
  await assert.rejects(adapter.saveRack({winnerSide:'A'}),e=>e.status===429);
  assert.equal(calls,1);
});
test('invalid takeover decision never reaches transport',async()=>{
  const {adapter}=client(()=>{throw new Error('transport must not run');});
  await assert.rejects(adapter.respondTakeover('anything'),/Release or Deny/);
});
