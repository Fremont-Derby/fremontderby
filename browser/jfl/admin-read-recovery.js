import { retryAfterMilliseconds } from './fixture-throttle.js';

// Observe only this page's selected-season reads. An advisory 429 shares the
// same budget as core reads, but an advisory denial cannot authorize a retry.
export function observeAdminReads(page, selectedSeason, clock = Date.now) {
  let pending = [];
  let failure;
  const observe = response => {
    const url = new URL(response.url());
    if (url.origin !== new URL(page.url()).origin || response.request().method() !== 'GET') return;
    const prefix = '/api/admin/seasons/' + selectedSeason() + '/';
    const core = url.pathname === '/api/admin/seasons'
      || [prefix + 'setup', prefix + 'team-registration'].includes(url.pathname);
    const advisory = [prefix + 'team-candidates', prefix + 'close-readiness'].includes(url.pathname);
    if ((!core && !advisory) || response.status() < 400) return;
    console.info(JSON.stringify({ method: 'GET', path: url.pathname.replace(prefix, '/api/admin/seasons/:selected-season/'),
      status: response.status(), retryAfter: response.headers()['retry-after'] || null }));
    if (response.status() !== 429) {
      if (core) failure = new Error(`Admin core read failed with HTTP${response.status()}; no recovery attempted`);
      return;
    }
    const now = clock();
    try { pending.push(now + retryAfterMilliseconds(response.headers()['retry-after'], now)); }
    catch (error) { failure = error; }
  };
  page.on('response', observe);
  return {
    hasPending() { return Boolean(failure) || pending.length > 0; },
    assertNoFailure() { if (failure) throw failure; },
    async wait() {
      for (let wave = 0; wave < 3; wave++) {
        if (failure) throw failure;
        if (!pending.length) {
          if (wave === 0) throw new Error('Admin recovery requires an observed matching HTTP429');
          return;
        }
        const deadline = Math.max(...pending);
        pending = [];
        const milliseconds = Math.max(0, deadline - clock()) + 1000;
        console.info(`Admin read HTTP429 recovery; validated cooldown=${milliseconds / 1000}s.`);
        await page.waitForTimeout(milliseconds);
      }
      if (failure) throw failure;
      if (pending.length) throw new Error('Admin reads remained throttled during bounded cooldown');
    },
    dispose() { page.off('response', observe); pending = []; },
  };
}

// Inject browser assertions so observer unit tests need no browser dependency.
export async function loadAdminSeason(page, target, reads, expect) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const loaded = async () => await page.locator('[data-season-setup-form]').getAttribute('data-loaded-season') === target.id
      && /read only/.test(await page.locator('[data-status]').textContent() || '');
    await expect.poll(async () => await loaded() || reads.hasPending(), { timeout: 45_000 }).toBe(true);
    reads.assertNoFailure();
    const complete = await loaded();
    if (!complete && !reads.hasPending()) throw new Error('Admin recovery requires an observed matching HTTP429');
    if (reads.hasPending()) await reads.wait();
    if (complete) return;
    expect(attempt, 'Core read stayed throttled after three supported UI retries').toBeLessThan(3);
    const retryList = page.locator('[data-retry-seasons]');
    const control = await retryList.isVisible() ? retryList : page.locator('[data-load]');
    await expect(control).toBeEnabled();
    await control.click();
  }
}
