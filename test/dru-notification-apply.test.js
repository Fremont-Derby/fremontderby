
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the DRU apply list includes the notification policy migration", () => {
  const src = readFileSync(new URL("../scripts/apply-dru-migrations.mjs", import.meta.url), "utf8");
  assert.match(src, /20261003113000_dru_notification_no_browser_policy.sql/);
});

import { druMigrationApplyPlan } from '../src/druMigrationApply.js';

test('the apply plan rejects a browser notification grant', () => {
  const plan = druMigrationApplyPlan({
    projectRef: 'oqkkvqkerusepyokzbmt',
    sqlFiles: ['supabase/migrations/20261003043000_dru_notification_rls.sql'],
    sqlTexts: ['grant select on table dru.user_notifications to anon'],
  });
  assert.equal(plan.ok, false);
});

test('the apply script gives the plan the migration text', () => {
  const src = readFileSync(new URL('../scripts/apply-dru-migrations.mjs', import.meta.url), 'utf8');
  assert.match(src, /sqlTexts: files.map/);
});
