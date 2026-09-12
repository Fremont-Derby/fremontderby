import test from 'node:test';
import assert from 'node:assert/strict';

import { createQaEvidenceHttp } from '../src/qaEvidenceHttp.js';
import { createQaEvidenceRepository } from '../src/qaEvidenceRepository.js';

const SHA='b794a527bacb1347ecb89b1dd2931e1c787c8240';
const env={
  ENVIRONMENT:'jfl',
  SUPABASE_SCHEMA:'jfl',
  SUPABASE_URL:'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'server-only-test-key',
  CF_VERSION_METADATA:{tag:SHA},
};

function row(overrides={}){
  return {
    schema_version:'1.0.0',lane:'jfl',run_id:'recent-1',replay_of_run_id:null,
    level_id:'persona.player.find-next-match',seed:'seed-1',build_sha:SHA,worker_version:SHA,
    started_at:'2026-09-11T00:00:00.000Z',completed_at:'2026-09-11T00:01:00.000Z',duration_ms:60000,
    tester_id:'opaque',session_id:null,
    device:{browser_family:'chrome',device_family:'android',viewport_width:412,viewport_height:915},
    fixture_facts:{world:'player'},
    assertions:[{assertion_id:'persona.player.find-next-match.discover',result:'pass',answered_at:'2026-09-11T00:01:00.000Z'}],
    outcome:'pass',note:null,events:[],...overrides,
  };
}

test('repository recent list is newest-first and clamps its own hard maximum', async()=>{
  let requested='';
  const repository=createQaEvidenceRepository(env,{fetch:async(url)=>{requested=url;return Response.json([{payload:row()}]);}});
  const runs=await repository.listRuns({limit:999});
  assert.equal(runs.length,1);
  assert.match(requested,/order=created_at\.desc/);
  assert.match(requested,/limit=500/);
});

test('recent evidence API requires explicit bearer and clamps client limit to 50', async()=>{
  const recent=[row()];
  const calls=[];
  const route=createQaEvidenceHttp({
    authenticateUser:async()=>({id:'admin-user'}),
    createAdminRepository:()=>({listPlayers:async({actorUserId})=>{calls.push(['admin',actorUserId]);return[];}}),
    createRepository:()=>({listRuns:async({limit})=>{calls.push(['list',limit]);return recent;}}),
  });
  const missing=await route(new Request('https://jfl.example/api/qa/evidence/recent?limit=500'),env);
  assert.equal(missing.status,401);

  const response=await route(new Request('https://jfl.example/api/qa/evidence/recent?limit=500',{headers:{authorization:'Bearer x'}}),env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{runs:recent,count:1});
  assert.deepEqual(calls,[['admin','admin-user'],['list',50]]);
});

test('recent evidence API returns 403 for non-admin and fails closed outside JFL', async()=>{
  const route=createQaEvidenceHttp({
    authenticateUser:async()=>({id:'player-user'}),
    createAdminRepository:()=>({listPlayers:async()=>{throw new Error('Actor is not a league admin');}}),
    createRepository:()=>({listRuns:async()=>{throw new Error('must not read');}}),
  });
  const request=new Request('https://jfl.example/api/qa/evidence/recent',{headers:{authorization:'Bearer x'}});
  const denied=await route(request,env);
  assert.equal(denied.status,403);
  assert.deepEqual(await denied.json(),{error:'League admin access is required'});
  assert.equal(await route(request,{...env,ENVIRONMENT:'production',SUPABASE_SCHEMA:'public'}),null);
});
