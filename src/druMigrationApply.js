import { assertNoBrowserNotificationGrant, assertNotificationRevoke, assertNotificationRls, assertNotificationWorkerGrant, assertNotificationDeny } from './druNotificationAccess.js';
const NON_PROD_REF = 'oqkkvqkerusepyokzbmt';

export function druMigrationApplyPlan({ projectRef, sqlFiles, sqlTexts }) {
  if (projectRef !== NON_PROD_REF) {
    return { ok: false, text: 'Migration apply is limited to the non-production project.' };
  }
  const files = sqlFiles || [];
  if (!files.length || files.some((file) => !file.includes('dru_'))) {
    return { ok: false, text: 'Migration apply failed closed.' };
  }
  for (const sql of sqlTexts || []) {
    try { assertNoBrowserNotificationGrant, assertNotificationRevoke, assertNotificationRls, assertNotificationWorkerGrant, assertNotificationDeny(sql); }
    catch (error) { return { ok: false, text: error.message }; }
  }
  return { ok: true, text: 'DRU migrations can be applied to the non-production project.', files };
}
