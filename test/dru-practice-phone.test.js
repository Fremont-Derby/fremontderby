import test from 'node:test';
import assert from 'node:assert/strict';
import { practicePhoneFor, ensureDruPracticePhone } from '../src/druPracticePhone.js';

test('a DRU practice phone starts with 555 and gamma does not write one', async () => {
  assert.match(practicePhoneFor('174d1405-cd54-4f53-a4a6-ae6d58d2eb71'), /^555\d{7}$/);
  assert.equal(await ensureDruPracticePhone({ ENVIRONMENT: 'gamma' }, '174d1405-cd54-4f53-a4a6-ae6d58d2eb71'), false);
});
