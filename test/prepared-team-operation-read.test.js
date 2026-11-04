import test from 'node:test';
import assert from 'node:assert/strict';
import {readPreparedAdminSeasonTeamOperationCommand} from '../src/adminSeasonTeamsCommands.js';
import {createAdminSeasonTeamsHttpHandlers} from '../src/adminSeasonTeamsHttp.js';
import {createAdminSeasonTeamsRepository} from '../src/adminSeasonTeamsRepository.js';
import {routeAdminSeasonTeams} from '../src/adminSeasonTeamsRouter.js';
const operationId='36490000-5000-4000-8000-000000000001';
const input={actorUserId:'actor',seasonId:'season',operationId};
test('lookup validates operation IDs before accessing the repository',async()=>{
 let reads=0;
 for(const id of [undefined,null,'',{},'bad','00000000-0000-0000-0000-000000000000'])await assert.rejects(readPreparedAdminSeasonTeamOperationCommand({...input,operationId:id},{readPreparedOperation(){reads++;}}),/operationId/);
 assert.equal(reads,0);
});
test('lookup authenticates first, binds the actor and never invokes creation',async()=>{
 const calls=[];let creates=0;
 const handlers=createAdminSeasonTeamsHttpHandlers({authenticate:async()=>({id:'real-actor'}),createRepository:()=>({readPreparedOperation:async value=>{calls.push(value);return null;},createPrepared:()=>{creates++;}})});
 const response=await handlers.readPreparedOperation(new Request('https://fixture.invalid/'),{},'season',operationId);
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{operation:null});assert.deepEqual(calls,[{...input,actorUserId:'real-actor'}]);assert.equal(creates,0);
});
test('lookup cannot disclose another admin operation',async()=>{
 const handlers=createAdminSeasonTeamsHttpHandlers({authenticate:async()=>({id:'actor'}),createRepository:()=>({readPreparedOperation:async()=>{throw new Error('Actor is not authorized for this creation operation');}})});
 assert.equal((await handlers.readPreparedOperation(new Request('https://fixture.invalid/'),{},'season',operationId)).status,403);
});
test('lookup repository uses only the read-only RPC once, even on failure',async()=>{
 for(const status of [200,429]){
  const calls=[];
  const repo=createAdminSeasonTeamsRepository({ENVIRONMENT:'jfl',SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-key',SUPABASE_SCHEMA:'jfl'},{fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json(status===200?[]:{message:'Busy'},{status});}});
  if(status===200)assert.equal(await repo.readPreparedOperation(input),null);else await assert.rejects(repo.readPreparedOperation(input),/429/);
  assert.deepEqual(calls,[{url:'https://fixture.invalid/rest/v1/rpc/admin_read_prepared_team_operation',body:{actor_user_id:'actor',target_season_id:'season',operation_id:operationId}}]);
 }
});
test('operation GET is absent from other lanes and never accepts a write verb',async()=>{
 const url='https://fixture.invalid/api/admin/seasons/season/prepared-team-operations/'+operationId;
 for(const lane of ['dru','gamma','production'])assert.equal((await routeAdminSeasonTeams(new Request(url),{ENVIRONMENT:lane})).status,404);
 assert.equal((await routeAdminSeasonTeams(new Request(url,{method:'POST'}),{ENVIRONMENT:'jfl'})).status,405);
});
