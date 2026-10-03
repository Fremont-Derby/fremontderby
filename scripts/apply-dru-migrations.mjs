#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { druMigrationApplyPlan } from '../src/druMigrationApply.js';
import { assertNoBrowserNotificationGrant } from '../src/druNotificationAccess.js';

const projectRef = process.env.SUPABASE_PROJECT_REF || '';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const files = [
  'supabase/migrations/20261003043000_dru_notification_rls.sql',
  'supabase/migrations/20261003113000_dru_notification_no_browser_policy.sql',
  'supabase/migrations/20261003043100_dru_admin_phone.sql',
];
const plan = druMigrationApplyPlan({ projectRef, sqlFiles: files });
if (!plan.ok) {
  console.error(plan.text);
  process.exit(1);
}
if (!token) {
  console.error('Migration apply failed closed.');
  process.exit(1);
}
console.log(plan.text);
for (const file of plan.files) {
  const query = assertNoBrowserNotificationGrant(readFileSync(file, 'utf8'));
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'fremont-dru-migration',
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`Migration apply failed closed. HTTP ${response.status}: ${text.slice(0, 180)}`);
    process.exit(1);
  }
  console.log(`Applied ${file}`);
}
console.log('DRU migrations applied.');
