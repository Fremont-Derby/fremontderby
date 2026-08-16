/**
 * #173 Privacy-safe workflow telemetry — no message bodies, phones, or tokens.
 * Counters only; safe to log in Worker analytics later.
 */

const COUNTERS = new Map();

export function trackEvent(name, dims = {}) {
  const key = String(name || 'unknown');
  // Strip any accidental sensitive keys
  const safe = {};
  for (const [k, v] of Object.entries(dims || {})) {
    if (/phone|token|password|email|message|body|authorization/i.test(k)) continue;
    if (typeof v === 'string' && v.length > 64) continue;
    safe[k] = v;
  }
  const bucket = COUNTERS.get(key) || { count: 0, last: null };
  bucket.count += 1;
  bucket.last = { at: new Date().toISOString(), dims: safe };
  COUNTERS.set(key, bucket);
  return bucket;
}

export function snapshotTelemetry() {
  return Object.fromEntries(
    [...COUNTERS.entries()].map(([k, v]) => [k, { count: v.count, last: v.last }]),
  );
}

export function resetTelemetry() {
  COUNTERS.clear();
}
