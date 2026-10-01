const REQUIRED = { dru: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE'], gamma: ['SUPABASE_URL'] };

export function requiredBindings(lane) {
  return REQUIRED[lane] || [];
}

export function defectGate(defect) {
  if (defect?.blocksNight) return { gate: 'fail', text: 'This defect fails the gate.' };
  return { gate: 'follow-up', text: 'This defect can ship with a follow-up.' };
}

export function ruleDecision(entry) {
  if (!entry?.rule || !entry?.impact) return null;
  return { rule: entry.rule, impact: entry.impact, text: `${entry.rule}: ${entry.impact}` };
}

export function deleteEntity(entity) {
  if (entity?.matches) return { deleted: false, text: 'This record has match history and cannot be deleted.' };
  return { deleted: true, text: 'Deleted.' };
}

export function secretHits(text) {
  return /service_role|sk_live|BEGIN PRIVATE KEY/.test(String(text || '')) ? ['secret-pattern'] : [];
}
