import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { boundedRetryAfterSeconds as parse, boundedRetryAfterParserSource } from '../src/boundedRetryAfter.js';
import { createSupabaseSeasonRepository } from '../src/supabaseSeasonRepository.js';

const now = Date.parse('2026-11-04T19:30:00.000Z');
test('delay-seconds accepts decimal integers including zero, without interpreting numeric expressions', () => {
  for (const [input,expected] of [['0',0],['000',0],[' 10 ',10],['300',300]]) assert.equal(parse(input,now),expected);
  for (const input of [null,undefined,'',' ','0x10','1e2','+10','-1','1.5','301','99999999999999999999999','10, 20']) {
    assert.equal(parse(input,now),null,String(input));
  }
});
test('three HTTP-date formats preserve the wait, validate dates and round up fractional seconds', () => {
  for (const input of ['Wed, 04 Nov 2026 19:30:10 GMT','Wednesday, 04-Nov-26 19:30:10 GMT','Wed Nov  4 19:30:10 2026']) {
    assert.equal(parse(input,now),10,input);
    assert.equal(parse(input,now+1),10,input);
    assert.equal(parse(input,now+11000),0,input);
  }
  for (const input of ['Thu, 04 Nov 2026 19:30:10 GMT','Wed, 31 Feb 2027 19:30:10 GMT',
    'Wed, 04 Nov 2026 25:30:10 GMT','2026-11-04T19:30:10Z','Wed, 04 Nov 2026 19:35:01 GMT',
    'Wed, 04 Nov 2026 19:30:10 GMT trailing']) assert.equal(parse(input,now),null,input);
  assert.equal(parse('Sunday, 06-Nov-94 08:49:37 GMT',now),0);
});
test('rendered parser is self-contained and matches the server parser', () => {
  const context = vm.createContext({});
  const embedded = vm.runInContext(boundedRetryAfterParserSource+'boundedRetryAfterSeconds',context);
  for (const input of ['0','10','0x10','301',null,'Wed, 04 Nov 2026 19:30:10 GMT']) {
    assert.equal(embedded(input,now),parse(input,now));
  }
});
test('real season repository forwards only validated wait metadata and never repeats its RPC', async () => {
  for (const [header,expected] of [[null,undefined],['0x10',undefined],['1e2',undefined],['301',undefined],['0','0'],['10','10']]) {
    let requests = 0;
    const repository = createSupabaseSeasonRepository({ ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-only' },{
      fetch: async () => { requests++; return Response.json({ message: 'busy' },{ status: 429, headers: header === null ? {} : { 'retry-after': header } }); },
    });
    await assert.rejects(repository.getSeasonSetup({ actorUserId: 'synthetic',seasonId: 'synthetic' }), error => {
      assert.equal(error.status,429); assert.equal(error.retryAfter,expected); return true;
    });
    assert.equal(requests,1);
  }
});
