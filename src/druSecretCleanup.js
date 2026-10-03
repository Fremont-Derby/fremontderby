const OBSOLETE_OVERRIDE_SECRETS = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'EXPECTED_SUPABASE_PROJECT_REF'];
const PRESERVED_SECRET = 'SUPABASE_SERVICE_ROLE_KEY';

export function druOverrideSecretPlan(names, env = {}) {
  if (String(env.ENVIRONMENT || '').trim() !== 'dru') {
    return { ok: false, text: 'Secret cleanup runs on DRU only.', delete: [] };
  }
  const present = new Set(names || []);
  if (present.has(PRESERVED_SECRET) === false && names == null) {
    return { ok: false, text: 'Secret cleanup failed closed.', delete: [] };
  }
  const deleteNames = OBSOLETE_OVERRIDE_SECRETS.filter((name) => present.has(name));
  if (deleteNames.includes(PRESERVED_SECRET)) {
    return { ok: false, text: 'Secret cleanup failed closed.', delete: [] };
  }
  return { ok: true, text: 'Obsolete DRU override secrets can be removed.', delete: deleteNames, preserve: PRESERVED_SECRET };
}

export function assertPreservedServiceRole(plan) {
  return plan?.preserve === PRESERVED_SECRET && !(plan.delete || []).includes(PRESERVED_SECRET);
}
