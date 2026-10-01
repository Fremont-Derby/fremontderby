export const NIGHT_STEPS = ['roster', 'schedule', 'scores'];

export function nightReady(done) {
  const missing = NIGHT_STEPS.filter(step => !done.includes(step));
  if (missing.length) return { ok: false, missing };
  return { ok: true, missing: [] };
}
