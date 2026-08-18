import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedApexService } from '../scripts/restore-lane-custom-domains.mjs';

test('isAllowedApexService accepts production Worker names', () => {
  assert.equal(isAllowedApexService('fremontderby'), true);
  assert.equal(isAllowedApexService('fremontderby-prod'), true);
});

test('isAllowedApexService rejects lane Workers and empty', () => {
  assert.equal(isAllowedApexService('fremontderby-dru'), false);
  assert.equal(isAllowedApexService('fremontderby-jfl'), false);
  assert.equal(isAllowedApexService('fremontderby-gamma'), false);
  assert.equal(isAllowedApexService(''), false);
  assert.equal(isAllowedApexService(null), false);
});
