/**
 * Fail-closed target guards for production → gamma refresh (#577).
 * Never allow production (or jfl/dru) as the *write* target.
 */

export const PRODUCTION_PROJECT_REF = 'cpiucsxlkicmlbvdvhww';
export const GAMMA_STAGING_PROJECT_REF = 'oqkkvqkerusepyokzbmt';
export const ALLOWED_TARGET_SCHEMA = 'gamma';

export function projectRefFromDatabaseUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  // postgres://...@db.<ref>.supabase.co:5432/postgres
  const m = raw.match(/@db\.([a-z0-9]+)\.supabase\.co\b/i)
    || raw.match(/([a-z0-9]+)\.supabase\.co\b/i);
  return m ? m[1].toLowerCase() : null;
}

export function projectRefFromSupabaseUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ sourceUrl?: string, targetUrl?: string, targetSchema?: string, targetProjectRef?: string, sourceProjectRef?: string }} input
 */
export function evaluateGammaRefreshPreflight(input = {}) {
  const errors = [];
  const notes = [];
  const targetSchema = String(input.targetSchema || ALLOWED_TARGET_SCHEMA).trim();
  const sourceRef =
    String(input.sourceProjectRef || '').trim().toLowerCase() ||
    projectRefFromDatabaseUrl(input.sourceUrl) ||
    projectRefFromSupabaseUrl(input.sourceUrl);
  const targetRef =
    String(input.targetProjectRef || '').trim().toLowerCase() ||
    projectRefFromDatabaseUrl(input.targetUrl) ||
    projectRefFromSupabaseUrl(input.targetUrl);

  if (!sourceRef) errors.push('Could not resolve production/source project ref from URL.');
  if (!targetRef) errors.push('Could not resolve gamma/target project ref from URL.');

  if (sourceRef && sourceRef !== PRODUCTION_PROJECT_REF) {
    notes.push(
      `Source project ref is "${sourceRef}" (configured production ref is ${PRODUCTION_PROJECT_REF}).`,
    );
  }

  if (targetSchema !== ALLOWED_TARGET_SCHEMA) {
    errors.push(`Target schema must be "${ALLOWED_TARGET_SCHEMA}" (got "${targetSchema}").`);
  }

  if (targetRef === PRODUCTION_PROJECT_REF) {
    errors.push('Refusing target: production project cannot be the refresh write target.');
  }
  if (targetRef && targetRef !== GAMMA_STAGING_PROJECT_REF) {
    errors.push(
      `Refusing target project "${targetRef}"; expected gamma staging project ${GAMMA_STAGING_PROJECT_REF}.`,
    );
  }
  if (sourceRef && targetRef && sourceRef === targetRef) {
    errors.push('Refusing refresh: source and target project refs must differ.');
  }
  if (['jfl', 'dru', 'public'].includes(targetSchema)) {
    errors.push(`Refusing target schema "${targetSchema}".`);
  }

  return {
    ok: errors.length === 0,
    errors,
    notes,
    sourceProjectRef: sourceRef,
    targetProjectRef: targetRef,
    targetSchema,
  };
}
