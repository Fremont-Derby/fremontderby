import assert from 'node:assert/strict';
import test from 'node:test';
import { druMigrationApplyPlan } from '../src/druMigrationApply.js';

test('DRU migrations apply only to the non-production project', () => {
  const wrong = druMigrationApplyPlan({ projectRef: 'other', sqlFiles: ['supabase/migrations/20261003043000_dru_notification_rls.sql'] });
  assert.equal(wrong.text, 'Migration apply is limited to the non-production project.');
  const plan = druMigrationApplyPlan({
    projectRef: 'oqkkvqkerusepyokzbmt',
    sqlFiles: [
      'supabase/migrations/20261003043000_dru_notification_rls.sql',
      'supabase/migrations/20261003043100_dru_admin_phone.sql',
    ],
  });
  assert.equal(plan.text, 'DRU migrations can be applied to the non-production project.');
});
