import assert from 'node:assert/strict';
import test from 'node:test';

import { siteStyles } from '../src/siteStyles.js';

test('JFL Schedule Details stays a compact disclosure after the generic surface contract', () => {
  const genericSurface = siteStyles.indexOf('.card, .panel, .hero');
  const scheduleOverride = siteStyles.indexOf('.fd-schedule-match__details', genericSurface + 1);

  assert.ok(genericSurface >= 0, 'expected the generic surface contract');
  assert.ok(scheduleOverride > genericSurface, 'Schedule override must come after the generic details surface rule');

  const scopedRule = siteStyles.slice(scheduleOverride, siteStyles.indexOf('}', scheduleOverride) + 1);
  assert.match(scopedRule, /border:\s*0\s*!important/);
  assert.match(scopedRule, /border-top:\s*1px solid #eceae4\s*!important/);
  assert.match(scopedRule, /border-radius:\s*0\s*!important/);
  assert.match(scopedRule, /background:\s*transparent\s*!important/);
  assert.match(scopedRule, /box-shadow:\s*none\s*!important/);
});
