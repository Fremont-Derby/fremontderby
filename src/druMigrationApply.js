const NON_PROD_REF = 'oqkkvqkerusepyokzbmt';

export function druMigrationApplyPlan({ projectRef, sqlFiles }) {
  if (projectRef !== NON_PROD_REF) {
    return { ok: false, text: 'Migration apply is limited to the non-production project.' };
  }
  const files = sqlFiles || [];
  if (!files.length || files.some((file) => !file.includes('dru_'))) {
    return { ok: false, text: 'Migration apply failed closed.' };
  }
  return { ok: true, text: 'DRU migrations can be applied to the non-production project.', files };
}
