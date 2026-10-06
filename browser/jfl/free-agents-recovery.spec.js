import { test, expect } from '@playwright/test';
import { renderJflFreeAgentsPage } from '../../src/jflFreeAgentsPage.js';
const mode = process.env.PLAYWRIGHT_FREE_AGENTS_SOURCE || '0';
const source = mode !== '0';
const teams = { teamManagement: { captain_teams: [{ teamId: 'team-a', teamName: 'Synthetic Alpha', seasonName: 'Synthetic season', lineupRounds: [
  { roundId: 'round-a', roundNumber: 1, scheduledOn: '2099-10-13', opponentName: 'Synthetic Beta' },
  { roundId: 'round-b', roundNumber: 2, scheduledOn: '2099-10-20', opponentName: 'Synthetic Gamma' },
] }] } };
const candidates = { freeAgents: [
  { display_name: 'Synthetic Morgan', fargo_rating: 525, rating_status: 'established', availability_status: 'available', player_id: 'private-id', email: 'private@example.invalid', phone_number: 'private-phone', payment_status: 'private-payment' },
  { display_name: '<script>synthetic</script> Lee', fargo_rating: null, availability_status: 'unsure' },
] };
test.beforeAll(async ({ request }) => {
  if (source) return;
  expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
  const r = await request.get('/health/environment'); expect(r.ok()).toBeTruthy();
  expect(await r.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
});
async function open(browser, mobile, signedOut = false) {
  const context = await browser.newContext({ baseURL: source ? 'https://free.test' : 'https://jfl.fremontderby.com', viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 } });
  if (!signedOut) await context.addInitScript(() => { if (window === window.top) sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'); });
  const page = await context.newPage(); const reads = []; const writes = []; const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (req.method() !== 'GET') { writes.push(path); return route.fulfill({ status: 500, body: '{}' }); }
    if (path === '/api/me/teams' || path.includes('/eligible-free-agents')) { reads.push({ route, path }); return; }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  if (source) await page.route('https://free.test/free-agents', async route => {
    let html = renderJflFreeAgentsPage();
    if (mode === 'bundled') { const { default: worker } = await import('../../dist/routerEntry.js'); html = await (await worker.fetch(new Request(route.request().url()), { ENVIRONMENT: 'jfl' }, {})).text(); }
    await route.fulfill({ contentType: 'text/html', body: html });
  });
  await page.goto('/free-agents');
  const respond = (index, body, status = 200) => reads[index].route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const wait = count => expect.poll(() => reads.length).toBe(count);
  async function populate() { await wait(1); await respond(0, teams); await wait(2); await respond(1, candidates); await expect(page.locator('[data-free-results] li')).toHaveCount(2); }
  return { page, context, reads, writes, errors, respond, wait, populate };
}
for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  test(`populated search projects safe fields and retains lineup (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.populate(); await expect(f.page.locator('[data-free-lineup]')).toHaveAttribute('href', '/lineup?team=team-a&round=round-a');
      await expect(f.page.locator('[data-free-results]')).toContainText('Fargo 525');
      await expect(f.page.locator('[data-free-results]')).not.toContainText(/private-id|private@example|private-phone|private-payment/);
      expect(await f.page.locator('[data-free-results] script').count()).toBe(0);
      await f.page.locator('[data-free-search]').fill('MORGAN'); await expect(f.page.locator('[data-free-results] li')).toHaveCount(1);
      await f.page.locator('[data-free-search]').fill('nobody'); await expect(f.page.locator('[data-free-state]')).toContainText('No matching candidates');
      await f.page.locator('[data-free-search]').fill(''); await expect(f.page.locator('[data-free-results] li')).toHaveCount(2);
      expect(f.writes).toEqual([]); expect(f.errors).toEqual([]);
      if (mobile) expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await f.context.close(); }
  });
  test(`retry invalidates authority and late candidate success (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.wait(1); await f.respond(0, teams); await f.wait(2); await f.page.locator('[data-free-retry]').click(); await f.wait(3);
      await expect(f.page.locator('[data-captain-workspace]')).toBeHidden(); await expect(f.page.locator('[data-free-lineup]')).toBeHidden();
      await f.respond(2, {}, 502); await f.respond(1, candidates);
      await expect(f.page.locator('[data-free-state]')).toContainText('Could not load'); await expect(f.page.locator('[data-free-results] li')).toHaveCount(0);
      await f.page.locator('[data-free-retry]').click(); await f.wait(4); await f.respond(3, teams); await f.wait(5); await f.respond(4, candidates);
      await expect(f.page.locator('[data-free-results] li')).toHaveCount(2); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`retry clears populated rows and rejects stale team response (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.populate(); await f.page.locator('[data-free-retry]').click(); await f.wait(3);
      await expect(f.page.locator('[data-free-results] li')).toHaveCount(0); await expect(f.page.locator('[data-free-lineup]')).toBeHidden();
      await f.page.locator('[data-free-retry]').click(); await f.wait(4); await f.respond(3, { teamManagement: { captain_teams: [] } }); await f.respond(2, teams);
      await expect(f.page.locator('[data-free-state]')).toContainText('No captained team'); await expect(f.page.locator('[data-captain-workspace]')).toBeHidden();
      expect(f.reads).toHaveLength(4); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  for (const status of [401, 403, 502]) test(`candidate ${status} stays failed during search and retry recovers (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.populate(); await f.page.locator('[data-free-round]').selectOption('round-b'); await f.wait(3); await f.respond(2, {}, status);
      const message = status === 401 ? 'sign-in expired' : status === 403 ? 'Only the active captain' : 'Could not load';
      await expect(f.page.locator('[data-free-state]')).toContainText(message); await expect(f.page.locator('[data-free-lineup]')).toBeHidden();
      await f.page.locator('[data-free-search]').evaluate(el => { el.value = 'Morgan'; el.dispatchEvent(new Event('input')); });
      await expect(f.page.locator('[data-free-state]')).toContainText(message); await expect(f.page.locator('[data-free-results] li')).toHaveCount(0);
      await f.page.locator('[data-free-retry]').click(); await f.wait(4); await f.respond(3, teams); await f.wait(5); await f.respond(4, candidates);
      await expect(f.page.locator('[data-free-results] li')).toHaveCount(1); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  for (const kind of ['teams', 'candidates']) test(`malformed ${kind} never claims empty success (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.wait(1); await f.respond(0, kind === 'teams' ? {} : teams); if (kind === 'candidates') { await f.wait(2); await f.respond(1, { freeAgents: 'bad' }); }
      await expect(f.page.locator('[data-free-state]')).toContainText('Could not load'); await expect(f.page.locator('[data-free-lineup]')).toBeHidden();
      await expect(f.page.locator('[data-free-results] li')).toHaveCount(0); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`round change ignores old candidate error (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.wait(1); await f.respond(0, teams); await f.wait(2); await f.page.locator('[data-free-round]').selectOption('round-b'); await f.wait(3);
      await f.respond(2, candidates); await f.respond(1, {}, 403); await expect(f.page.locator('[data-free-results] li')).toHaveCount(2);
      await expect(f.page.locator('[data-free-lineup]')).toHaveAttribute('href', '/lineup?team=team-a&round=round-b'); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`signed-out keeps canonical participation links (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile, true); try {
      await expect(f.page.locator('[data-free-state]')).toContainText('Sign in on Profile'); await expect(f.page.locator('[data-captain-workspace]')).toBeHidden();
      for (const path of ['/profile', '/schedule', '/teams']) await expect(f.page.locator('.fd-free__steps a[href="' + path + '"]')).toBeVisible();
      expect(f.reads).toEqual([]); expect(f.writes).toEqual([]); expect(f.errors).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`noncaptain and no-round expose no lineup (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile); try {
      await f.wait(1); await f.respond(0, { teamManagement: { captain_teams: [] } }); await expect(f.page.locator('[data-free-state]')).toContainText('No captained team');
      await f.page.locator('[data-free-retry]').click(); await f.wait(2); await f.respond(1, { teamManagement: { captain_teams: [{ ...teams.teamManagement.captain_teams[0], lineupRounds: [] }] } });
      await expect(f.page.locator('[data-free-state]')).toContainText('No upcoming published round'); await expect(f.page.locator('[data-free-round]')).toBeDisabled();
      await expect(f.page.locator('[data-free-lineup]')).toBeHidden(); expect(f.reads).toHaveLength(2); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
}
