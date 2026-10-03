export function rackLedger(racks) {
  return (racks || []).map((rack, index) => ({ n: index + 1, winner: rack.winner || 'open' }));
}

export function workflowHealth(checks) {
  const names = ['auth', 'teams', 'score', 'messages', 'admin'];
  return names.map((name) => ({ name, ok: Boolean(checks?.[name]) }));
}

export function requiredBindings(lane) {
  return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE'].map((name) => ({ lane, name }));
}

export function gateDefect(defect) {
  return { fails: defect?.severity === 'block', text: defect?.severity === 'block' ? 'This defect fails the gate.' : 'This defect can follow up.' };
}

export function agingReview(item) {
  return { review: (item?.ageDays || 0) >= 90, text: (item?.ageDays || 0) >= 90 ? 'Review this. It is 90 days old.' : 'Still current.' };
}

export function destructiveAction(action) {
  if (!action?.consequence) return { ok: false, text: 'Name the consequence before commit.' };
  return { ok: true, text: action.consequence };
}

export function factSource(fact) {
  if (!fact?.source) return null;
  return { text: `${fact.name} comes from ${fact.source}.` };
}
