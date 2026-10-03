export function rulesetCopy(lane) {
  return { text: `${lane || 'This lane'} ruleset is stored as JSON. A required check must be named before a merge.` };
}

export function validationData({ purpose }) {
  if (purpose === 'league') return { ok: false, text: 'Validation data cannot use a real league season.' };
  return { ok: true, text: 'Validation data stays on a practice season.' };
}
