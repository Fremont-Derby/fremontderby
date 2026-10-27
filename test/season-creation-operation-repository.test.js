import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseSeasonRepository} from '../src/supabaseSeasonRepository.js';
import {saveSeasonSetupCommand} from '../src/seasonSetupCommands.js';
import {handleCreateSeasonSetupRequest} from '../src/index.js';
const operationId='36520000-5000-4000-8000-000000000001';
const input={actorUserId:'actor',createNew:true,seasonPurpose:'qa',operationId,seasonName:' Created season ',leagueNight:'Tuesday',firstRoundDate:'2026-11-03',rosterLockRound:3,openingBlockLength:3,individualMinMatches:5,roundIntervalDays:7,tableNumbers:[1,2,3,4],raceChartVersion:'season-1-default',playoffTeamCount:4,playoffAnchorTiebreaker:true};
function fixture(status=200,created=true){const calls=[];const repository=createSupabaseSeasonRepository({ENVIRONMENT:'jfl',SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-key',SUPABASE_SCHEMA:'jfl'},{fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json(status===200?{created,setup:{id:'season',name:'Current name'}}:{message:'Busy'},{status});}});return{repository,calls};}
test('operation validates before calling the repository and cannot edit an existing target',async()=>{
 let calls=0;for(const value of ['',null,{},'bad','00000000-0000-0000-0000-000000000000'])await assert.rejects(saveSeasonSetupCommand({...input,operationId:value},{saveSeasonSetup(){calls++;}}),/operationId/);
 await assert.rejects(saveSeasonSetupCommand({...input,createNew:false},{saveSeasonSetup(){calls++;}}),/operationId/);assert.equal(calls,0);
});
test('normalized creation arguments and exact identity reach the guarded RPC',async()=>{
 const f=fixture();const result=await saveSeasonSetupCommand(input,f.repository);
 assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/\/create_season_setup_once$/);assert.equal(f.calls[0].body.operation_id,operationId);assert.equal(f.calls[0].body.actor_user_id,'actor');assert.equal(f.calls[0].body.creation_input.configured_season_name,'Created season');assert.equal(f.calls[0].body.creation_input.configured_purpose,'qa');assert.equal(Object.hasOwn(f.calls[0].body.creation_input,'actor_user_id'),false);assert.equal(result.creationAcknowledged,false);
});
test('acknowledgment retains current state and flags callers against reapplying registration',async()=>{
 const f=fixture(200,false);const result=await saveSeasonSetupCommand(input,f.repository);assert.deepEqual(result,{id:'season',name:'Current name',creationOperationId:operationId,creationAcknowledged:true});
});
test('429 creation is never automatically replayed and legacy clients retain their constructor',async()=>{
 const f=fixture(429);await assert.rejects(saveSeasonSetupCommand(input,f.repository),/429/);assert.equal(f.calls.length,1);
 const legacy=fixture();const{operationId:ignored,...old}=input;await saveSeasonSetupCommand(old,legacy.repository);assert.match(legacy.calls[0].url,/\/create_season_setup$/);assert.equal(Object.hasOwn(legacy.calls[0].body,'operation_id'),false);
});
test('read recovery uses the actor-bound read RPC without invoking a creator',async()=>{
 const f=fixture();await f.repository.readSeasonCreationOperation({actorUserId:'actor',operationId});assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/\/read_season_creation_operation$/);assert.deepEqual(f.calls[0].body,{actor_user_id:'actor',operation_id:operationId});
});
test('authenticated season POST forwards a valid identity and rejects invalid identity before a write',async()=>{
 const calls=[];
 const env={ENVIRONMENT:'jfl',SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server',SUPABASE_PUBLISHABLE_KEY:'synthetic-public',SUPABASE_SCHEMA:'jfl'};
 const fetch=async(url,options)=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:'authenticated-actor'});calls.push({url,body:JSON.parse(options.body)});return Response.json({created:true,setup:{id:'season'}});};
 const request=value=>new Request('https://fixture.invalid/api/admin/seasons',{method:'POST',headers:{authorization:'Bearer synthetic-session','content-type':'application/json'},body:JSON.stringify({...input,operationId:value})});
 const response=await handleCreateSeasonSetupRequest(request(operationId),env,{fetch});assert.equal(response.status,201);assert.equal((await response.json()).setup.creationOperationId,operationId);assert.match(calls[0].url,/\/create_season_setup_once$/);assert.equal(calls[0].body.actor_user_id,'authenticated-actor');
 assert.equal((await handleCreateSeasonSetupRequest(request(null),env,{fetch})).status,400);assert.equal(calls.length,1);
});
