// Test recovery only: no default cooldown and no retry without an observed 429.
export function retryAfterMilliseconds(header, now = Date.now()) {
  const value = typeof header === 'string' ? header.trim() : '';
  const timestamp = Date.parse(value);
  const seconds = /^\d+$/.test(value) ? Number(value)
    : Number.isFinite(timestamp) && new Date(timestamp).toUTCString() === value ? (timestamp - now) / 1000 : NaN;
  if (!value || !Number.isFinite(seconds) || seconds <= 0 || seconds > 60) {
    throw new Error('Fixture recovery requires a validated positive Retry-After within 60 seconds');
  }
  return Math.ceil(seconds * 1000);
}

export async function waitForObserved429(page, result, now = Date.now()) {
  if (result.status !== 429) throw new Error('Fixture recovery requires an observed HTTP429');
  const milliseconds = retryAfterMilliseconds(result.retryAfter, now) + 1000;
  console.info(`Fixture HTTP429 recovery; validated cooldown=${milliseconds / 1000}s.`);
  await page.waitForTimeout(milliseconds);
}

export function observeAvailabilityThrottle(page, seasonId, clock = Date.now) {
  const paths = new Set(['/api/me/teams', '/api/me/team-match-choices', `/api/seasons/${seasonId}/availability/me`]);
  let observations = [];
  const observe = response => {
    if (response.status() !== 429 || response.request().method() !== 'GET' || !paths.has(new URL(response.url()).pathname)) return;
    const now = clock();
    try {
      observations.push({ deadline: now + retryAfterMilliseconds(response.headers()['retry-after'], now) });
    } catch (error) { observations.push({ error }); }
  };
  page.on('response', observe);
  return {
    async wait() {
      for (let wave = 0; wave < 3; wave += 1) {
        const pending = observations;
        observations = [];
        if (!pending.length) {
          if (wave === 0) throw new Error('Availability recovery requires an observed matching HTTP429');
          return;
        }
        const invalid = pending.find(item => item.error);
        if (invalid) throw invalid.error;
        const milliseconds = Math.max(0, Math.max(...pending.map(item => item.deadline)) - clock()) + 1000;
        console.info(`Availability HTTP429 recovery; validated cooldown=${milliseconds / 1000}s.`);
        await page.waitForTimeout(milliseconds);
      }
      if (observations.length) throw new Error('Availability remained throttled during bounded cooldown');
    },
    hasObservation() { return observations.length > 0; },
    dispose() { page.off('response', observe); observations = []; },
  };
}
