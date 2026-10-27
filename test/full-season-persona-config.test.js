import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listTestPersonas, selectedTestPersonaKey } from '../src/testPersona.js';

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8').replace(/^\uFEFF/,''));
test('only named JFL deployment configuration activates the qualified full-season actors', () => {
  assert.equal(config.vars?.TEST_FULL_SEASON_PERSONAS_ENABLED, undefined);
  for(const [name,lane] of Object.entries(config.env)) {
    const env={...config.vars,...lane.vars};
    const additional=listTestPersonas(env).filter(p=>p.key.startsWith('full-season-captain-'));
    assert.equal(additional.length,name==='jfl'?8:0,`persona isolation for ${name}`);
    if(name!=='jfl') assert.equal(lane.vars?.TEST_FULL_SEASON_PERSONAS_ENABLED,undefined);
    const cookie=new Request('https://fixture.invalid/profile',{headers:{cookie:'fd_test_persona='+encodeURIComponent(`${env.ENVIRONMENT}:full-season-captain-1`)}});
    assert.equal(selectedTestPersonaKey(cookie,env),name==='jfl'?'full-season-captain-1':null);
  }
});
