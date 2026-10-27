import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreparedAdminSeasonTeamCommand} from '../src/adminSeasonTeamsCommands.js';
import {createAdminSeasonTeamsHttpHandlers} from '../src/adminSeasonTeamsHttp.js';
const base={actorUserId:'actor',seasonId:'season',teamName:' Prepared team '};
test('creation operation rejects malformed and nil identities before repository execution',async()=>{
 for(const operationId of ['',null,{},'not-an-id','00000000-0000-0000-0000-000000000000']){
  let calls=0;await assert.rejects(createPreparedAdminSeasonTeamCommand({...base,operationId},{createPrepared(){calls++;}}),/operationId/);assert.equal(calls,0);
 }
});
test('valid operation retains exact identity alongside normalized name',async()=>{
 const operationId='36490000-5000-4000-8000-000000000001';let seen;
 await createPreparedAdminSeasonTeamCommand({...base,operationId},{createPrepared(input){seen=input;return{id:'team'};}});
 assert.deepEqual(seen,{...base,teamName:'Prepared team',operationId});
});
test('normal HTTP creation forwards the operation and rejects invalid input before any write',async()=>{
 const calls=[];
 const handlers=createAdminSeasonTeamsHttpHandlers({authenticate:async()=>({id:'actor'}),createRepository:()=>({createPrepared:async input=>{calls.push(input);return{id:'team'};}})});
 const request=operationId=>new Request('https://fixture.invalid/api/admin/seasons/season/prepared-teams',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({teamName:'Prepared team',operationId})});
 const id='36490000-5000-4000-8000-000000000001';
 assert.equal((await handlers.createPrepared(request(id),{},'season')).status,201);assert.equal(calls[0].operationId,id);
 for(const bad of [null,'',false,'bad'])assert.equal((await handlers.createPrepared(request(bad),{},'season')).status,400);
 assert.equal(calls.length,1);
});
