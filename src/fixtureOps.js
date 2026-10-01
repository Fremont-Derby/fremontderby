export function validationFixture(seed) {
  if (!seed) return null;
  return { seed, sql: false, text: `Fixture ${seed} is built without direct SQL.` };
}

export function gateEvidence(gate) {
  if (!gate?.name || !gate?.persona) return null;
  return { text: `${gate.persona} checked ${gate.name}.` };
}

export function validationSupport(items) {
  return (items || []).filter((item) => item.evidence).map((item) => item.name);
}

export function tddEvidence(step) {
  const order = ['red', 'green', 'refactor'];
  return { ok: order.includes(step), text: order.includes(step) ? `Recorded ${step}.` : 'Evidence must be red, green, or refactor.' };
}

export function humanValidation(step) {
  const steps = ['open the page', 'do the task', 'say what failed'];
  return { steps, text: steps.includes(step) ? step : 'Use a known validation step.' };
}
