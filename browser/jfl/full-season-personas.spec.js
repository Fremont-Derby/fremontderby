import { test, expect } from '@playwright/test';
import { injectTestPersonaControls } from '../../src/testPersonaEnhancer.js';
import { routeTestPersona } from '../../src/testPersonaHttp.js';
import { JFL_SIMULATED_OIDC_ACCESS_TOKEN } from '../../src/supabaseAuth.js';

// Real persona component and authenticated HTTP handler, synthetic operator and
// empty profile shell. All browser requests intercepted; no hosted fixture use.
for (const mobile of [false, true]) {
  for (const mode of ['enabled', 'disabled', 'gamma']) {
    test(`full-season captain selection ${mode} (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
      const env = { ENVIRONMENT: mode === 'gamma' ? 'gamma' : 'jfl', TEST_FULL_SEASON_PERSONAS_ENABLED: mode === 'disabled' ? undefined : '1', TEST_PERSONA_OPERATOR_USER_IDS: 'fixture-operator', BETA_AUTH_BYPASS: '1', BETA_ACTOR_USER_ID: 'fixture-operator', SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'fixture' };
      const token = mode === 'gamma' ? 'synthetic-real-bearer' : JFL_SIMULATED_OIDC_ACCESS_TOKEN;
      const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
      await context.addInitScript(token => sessionStorage.setItem('fd.accessToken', token), token);
      const posts = [];
      await context.route('**/*', async route => {
        const req = route.request(), url = new URL(req.url());
        if (url.pathname === '/profile') {
          const response = await injectTestPersonaControls(new Response('<!doctype html><html><body><main data-authenticated-content></main></body></html>', { headers: { 'content-type': 'text/html' } }));
          return route.fulfill({ contentType: 'text/html', body: await response.text() });
        }
        expect(url.pathname).toBe('/api/test-persona');
        const request = new Request(req.url(), { method: req.method(), headers: req.headers(), ...(req.method() === 'POST' ? { body: req.postData() } : {}) });
        if (req.method() === 'POST') posts.push(req.postDataJSON());
        const response = await routeTestPersona(request, env, { fetch: async () => Response.json({ id: 'fixture-operator' }) });
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      try {
        await page.goto('https://persona.fixture.test/profile');
        const select = page.locator('[data-test-persona-select]');
        await expect(select.locator('option')).toHaveCount(mode === 'enabled' ? 14 : 6);
        if (mode !== 'enabled') {
          await expect(select).not.toContainText('Full-season Captain');
          expect(posts).toHaveLength(0);
          return;
        }
        for (let i = 1; i <= 8; i++) {
          const key = `full-season-captain-${i}`;
          await select.selectOption(key);
          await expect(page.locator('[data-test-persona-banner]')).toContainText(`Full-season Captain ${i}`);
          await expect(select).toHaveValue(key);
          const cookies = await context.cookies();
          const cookie = cookies.find(cookie => cookie.name === 'fd_test_persona');
          expect(cookie.httpOnly).toBe(true); expect(cookie.secure).toBe(true); expect(cookie.sameSite).toBe('Strict');
          expect(decodeURIComponent(cookie.value)).toBe(`jfl:${key}`);
          expect(await page.evaluate(() => document.cookie)).not.toContain('fd_test_persona');
        }
        expect(posts).toEqual(Array.from({ length: 8 }, (_, i) => ({ persona: `full-season-captain-${i + 1}` })));
        await select.selectOption('');
        await expect(select).toHaveValue('');
        await expect(page.locator('[data-test-persona-banner]')).toHaveCount(0);
        expect((await context.cookies()).some(cookie => cookie.name === 'fd_test_persona')).toBe(false);
      } finally { await context.close(); }
    });
  }
}
