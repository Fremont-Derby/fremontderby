import { test, expect } from '@playwright/test';
import { renderProfilePage } from '../../src/profilePage.js';
import { enhanceProfileSeasonRegistration } from '../../src/profileSeasonRegistrationEnhancer.js';

const seasons = [{ id: 'season-a', name: 'Alpha registration', status: 'registration' },
  { id: 'season-b', name: 'Beta registration', status: 'registration' },
  { id: 'season-c', name: 'Closed season', status: 'active' }];
let html;
test.beforeAll(async ({ request }) => {
  if (process.env.PLAYWRIGHT_PROFILE_HTML === 'deployed') {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(await health.json()).toMatchObject({ ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    const response = await request.get('/profile');
    expect(response.ok()).toBe(true);
    html = await response.text();
  } else if (process.env.PLAYWRIGHT_PROFILE_HTML === 'built') {
    const { default: worker } = await import('../../dist/routerEntry.js');
    const response = await worker.fetch(new Request('https://jfl.fremontderby.com/profile'), { ENVIRONMENT: 'jfl' }, { waitUntil() {} });
    html = await response.text();
  } else {
    html = await (await enhanceProfileSeasonRegistration(new Response(renderProfilePage({}), { headers: { 'content-type': 'text/html' } }))).text();
  }
  expect(html).toContain('data-season-now');
});

async function open(browser, mobile, query, options = {}) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
  if (!options.signedOut) await context.addInitScript(() => {
    if (window === window.top) sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only');
  });
  const reads = [], writes = [];
  let registration = options.registered ? { registrationStatus: 'active', paymentStatus: 'paid' } : null;
  await context.route('**/*', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/profile') return route.fulfill({ contentType: 'text/html', body: html });
    if (path === '/api/seasons') return route.fulfill({ json: { seasons } });
    if (path === '/api/me/profile') return route.fulfill({ json: { profile: { id: 'synthetic-player', displayName: 'Synthetic player', teams: [{ seasonId: 'season-b' }], seasons: [] } } });
    if (/\/registration\/me$/.test(path)) {
      if (req.method() === 'GET') {
        reads.push(path);
        return route.fulfill({ status: options.denied ? 403 : 200, json: options.denied ? { error: 'Registration denied' } : { registration } });
      }
      writes.push({ path, body: req.postDataJSON() });
      registration = { registrationStatus: 'active', paymentStatus: 'unpaid' };
      return route.fulfill({ status: 201, json: { registration } });
    }
    return route.fulfill({ status: req.method() === 'GET' ? 200 : 403, json: {} });
  });
  const page = await context.newPage();
  await page.goto('https://jfl.fremontderby.com/profile' + query);
  return { context, page, reads, writes };
}

// All traffic is intercepted; no real registration, persona or fixture writes.
for (const mobile of [false, true]) {
  test(`Profile explicit season joins the requested season and retains it on refresh (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=season-b');
    try {
      await expect(f.page.locator('[data-season-now-name]')).toHaveText('Beta registration');
      await expect(f.page.locator('[data-season-now-action]')).toHaveText('Join this season');
      await f.page.locator('[data-season-now-action]').click();
      await expect(f.page.locator('[data-registration-state]')).toHaveText('Registered');
      expect(f.writes).toEqual([{ path: '/api/seasons/season-b/registration/me', body: { participationType: 'rostered' } }]);
      await f.page.reload();
      await expect(f.page.locator('[data-season-now-name]')).toHaveText('Beta registration');
      await expect(f.page.locator('[data-registration-state]')).toHaveText('Registered');
      expect(f.reads.every(path => path === '/api/seasons/season-b/registration/me')).toBe(true);
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  for (const query of ['?season=unknown', '?season=', '?season=season-b&season=season-a']) {
    test(`Profile unavailable explicit season ${query} never falls back (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
      const f = await open(browser, mobile, query);
      try {
        await expect(f.page.locator('[data-season-now-error]')).toContainText('requested season');
        await expect(f.page.locator('[data-season-now-current]')).toHaveAttribute('href', '/profile');
        expect(f.reads).toEqual([]);
        expect(f.writes).toEqual([]);
        await expect(f.page.locator('[data-season-now-action]')).toHaveText('Try again');
        await f.page.locator('[data-season-now-action]').click();
        await expect(f.page.locator('[data-season-now-error]')).toContainText('requested season');
        expect(f.reads).toEqual([]);
        expect(f.writes).toEqual([]);
      } finally { await f.context.close(); }
    });
  }

  test(`Profile closed explicit season cannot join another open season (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=season-c');
    try {
      await expect(f.page.locator('[data-season-now-name]')).toHaveText('Closed season');
      await expect(f.page.locator('[data-season-now-badge]')).toHaveText('Registration closed');
      await expect(f.page.locator('[data-season-now-action]')).toBeHidden();
      expect(f.reads).toEqual([]);
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });

  test(`Profile default registration and paid status retain existing behavior (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '', { registered: true });
    try {
      await expect(f.page.locator('[data-season-now-name]')).toHaveText('Alpha registration');
      await expect(f.page.locator('[data-payment-state]')).toHaveText('Paid');
      await expect(f.page.locator('[data-season-now-action]')).toBeHidden();
      expect(f.reads).toEqual(['/api/seasons/season-a/registration/me']);
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });

  test(`Profile requested-season denial cannot offer Join for another season (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=season-b', { denied: true });
    try {
      await expect(f.page.locator('[data-season-now-error]')).toHaveText('Registration denied');
      expect(f.reads).toEqual(['/api/seasons/season-b/registration/me']);
      expect(f.writes).toEqual([]);
      await expect(f.page.locator('[data-season-now-action]')).toHaveText('Try again');
    } finally { await f.context.close(); }
  });

  test(`Profile signed-out requested-season page never reads or joins registration (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=season-b', { signedOut: true });
    try {
      await expect(f.page.locator('[data-authenticated-content]')).toBeHidden();
      expect(f.reads).toEqual([]);
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
}
