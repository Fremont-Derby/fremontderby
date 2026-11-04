import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminSeasonTeamsRepository} from '../src/adminSeasonTeamsRepository.js';
const input={actorUserId:'36490000-0000-4000-8000-000000000001',seasonId:'36490000-1000-4000-8000-000000000001',teamName:'Synthetic prepared team',operationId:'36490000-5000-4000-8000-000000000001'};
function fixture(status=200){const calls=[];const repository=createAdminSeasonTeamsRepository({ENVIRONMENT:'jfl',SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server-key',SUPABASE_SCHEMA:'jfl'},{fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json(status===200?[{id:'team',season_id:input.seasonId,name:input.teamName}]:{message:'Synthetic failure'},{status});}});return{repository,calls};}
test('operation identity reaches the atomic RPC with exact actor/season/input',async()=>{
 const f=fixture();await f.repository.createPrepared(input);
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'https://fixture.invalid/rest/v1/rpc/admin_create_prepared_team_once');
 assert.deepEqual(f.calls[0].body,{actor_user_id:input.actorUserId,target_season_id:input.seasonId,team_name:input.teamName,operation_id:input.operationId});
});
test('existing clients retain the original creation endpoint',async()=>{
 const f=fixture();const{operationId,...legacy}=input;await f.repository.createPrepared(legacy);
 assert.equal(f.calls[0].url,'https://fixture.invalid/rest/v1/rpc/admin_create_prepared_team');assert.equal(Object.hasOwn(f.calls[0].body,'operation_id'),false);
});
test('even an operation-aware HTTP429 is never automatically replayed',async()=>{
 const f=fixture(429);await assert.rejects(f.repository.createPrepared(input),/429/);assert.equal(f.calls.length,1);
});
