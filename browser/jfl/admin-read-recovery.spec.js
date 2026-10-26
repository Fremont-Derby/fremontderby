import { test, expect } from '@playwright/test';
import { observeAdminReads, loadAdminSeason } from './admin-read-recovery.js';

// Intercept every request; no persona, credentials, or live fixture writes.
for (const kind of ['numeric', 'date', 'missing', 'invalid', 'zero', 'large', 'denied']) {
  test(`Admin read recovery ${kind} uses only qualified cooldowns and explicit controls`, async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    let requests = 0;
    let deadline;
    let retriedAt;
    await context.route('**/*', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/') return route.fulfill({ contentType: 'text/html', body: `
        <form data-season-setup-form data-loaded-season=""><p data-status>Loading</p></form>
        <button data-retry-seasons>Retry season list</button><button data-load hidden>Load</button>
        <script>
          async function load() {
            const r = await fetch('/api/admin/seasons');
            if (r.ok) {
              document.querySelector('form').dataset.loadedSeason = 'qa';
              document.querySelector('[data-status]').textContent = 'read only';
            } else document.querySelector('[data-status]').textContent = 'Read failed';
          }
          document.querySelector('[data-retry-seasons]').onclick = load;
          document.querySelector('[data-load]').onclick = load;
          load();
        </script>` });
      requests++;
      if (requests === 2) retriedAt = Date.now();
      const value = { numeric: '1', date: new Date(Date.now() + 2000).toUTCString(), invalid: 'bad', zero: '0', large: '61' }[kind];
      if (requests === 1) deadline = kind === 'numeric' ? Date.now() + 1000 : Date.parse(value);
      return route.fulfill({ status: requests > 1 ? 200 : kind === 'denied' ? 403 : 429,
        headers: value ? { 'retry-after': value } : {}, json: {} });
    });
    const reads = observeAdminReads(page, () => 'qa');
    try {
      await page.goto('https://admin-policy.test/');
      await expect.poll(() => reads.hasPending()).toBe(true);
      if (kind === 'numeric' || kind === 'date') {
        // Cover list retry and selected-season Load recovery, respectively.
        if (kind === 'date') await page.evaluate(() => {
          document.querySelector('[data-retry-seasons]').hidden = true;
          document.querySelector('[data-load]').hidden = false;
        });
        await loadAdminSeason(page, { id: 'qa' }, reads, expect);
        expect(retriedAt).toBeGreaterThanOrEqual(deadline);
        expect(requests).toBe(2);
      } else {
        await expect(loadAdminSeason(page, { id: 'qa' }, reads, expect)).rejects.toThrow(
          kind === 'denied' ? /HTTP403/ : /validated positive/);
        expect(requests).toBe(1);
      }
    } finally {
      reads.dispose();
      await context.close();
    }
  });
}

test('loaded Admin page still honors an advisory cooldown without retrying a successful load', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let requests = 0;
  let deadline;
  await context.route('**/*', route => {
    if (new URL(route.request().url()).pathname === '/') return route.fulfill({ contentType: 'text/html', body: `
      <form data-season-setup-form data-loaded-season="qa"><p data-status>read only</p></form>
      <script>fetch('/api/admin/seasons/qa/close-readiness')</script>` });
    requests++;
    deadline = Date.now() + 1000;
    return route.fulfill({ status: 429, headers: { 'retry-after': '1' }, json: {} });
  });
  const reads = observeAdminReads(page, () => 'qa');
  try {
    await page.goto('https://admin-policy.test/');
    await expect.poll(() => reads.hasPending()).toBe(true);
    await loadAdminSeason(page, { id: 'qa' }, reads, expect);
    expect(Date.now()).toBeGreaterThanOrEqual(deadline);
    expect(requests).toBe(1);
  } finally { reads.dispose(); await context.close(); }
});
