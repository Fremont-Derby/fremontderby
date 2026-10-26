import { test, expect } from '@playwright/test';
import { renderJflModernTeams } from '../../src/jflModernTeams.js';

const seasons = [{ id: 'a', name: 'Alpha', status: 'registration' }, { id: 'b', name: 'Beta', status: 'registration' }, { id: 'closed', name: 'Closed', status: 'complete' }];
let html;
test.beforeAll(async ({ request }) => {
  if (process.env.PLAYWRIGHT_TEAMS_CONTEXT_HTML === 'deployed') {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({ ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    const response = await request.get('/teams');
    expect(response.headers()['x-fremont-ui-mode']).toBe('modern-teams-v1');
    html = await response.text();
  } else if (process.env.PLAYWRIGHT_TEAMS_CONTEXT_HTML === 'built') {
    const { default: worker } = await import('../../dist/routerEntry.js');
    const response = await worker.fetch(new Request('https://jfl.fremontderby.com/teams'), { ENVIRONMENT: 'jfl' }, { waitUntil() {} });
    expect(response.headers.get('x-fremont-ui-mode')).toBe('modern-teams-v1');
    html = await response.text();
  } else html = renderJflModernTeams();
});

async function open(browser, mobile, query, options = {}) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
  if (!options.signedOut) await context.addInitScript(() => {
    if (window === window.top) sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only');
  });
  const writes = [];
  const applications = options.existing ? [{ proposedTeamName: 'Existing synthetic team', status: 'applied' }] : [];
  await context.route('**/*', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/teams') return route.fulfill({ contentType: 'text/html', headers: { 'x-fremont-ui-mode': 'modern-teams-v1' }, body: html });
    if (req.method() !== 'GET') {
      writes.push({ path, body: req.postDataJSON() });
      if (!options.denied) applications.push({ proposedTeamName: 'Synthetic team', status: 'applied' });
      return route.fulfill({ status: options.denied ? 403 : 202, json: options.denied ? { error: 'Application denied' } : {} });
    }
    if (path === '/api/me/teams') return route.fulfill({ json: { teamManagement: { captain_teams: [], invitations: [], players: [] } } });
    if (path === '/api/me/team-membership-requests') return route.fulfill({ json: { requests: {} } });
    if (path === '/api/seasons') return route.fulfill({ json: { seasons } });
    if (path.endsWith('/team-registration/me')) return route.fulfill({ json: { registration: { applications: path.includes('/b/') ? applications : [] } } });
    return route.fulfill({ json: { standings: [] } });
  });
  const page = await context.newPage();
  await page.goto('https://jfl.fremontderby.com/teams' + query);
  if (!options.signedOut) {
    await expect(page.locator('[data-teams-content]')).toBeVisible();
    await page.locator('.fd-teams__formation > summary').click();
  }
  return { page, context, writes };
}

// Every request is intercepted; there are no real team applications or fixtures.
for (const mobile of [false, true]) {
  test(`modern Teams explicit Beta application keeps its target on refresh (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=b');
    try {
      await expect(f.page.locator('[data-team-season]')).toHaveValue('b');
      await f.page.reload();
      await expect(f.page.locator('[data-teams-content]')).toBeVisible();
      await f.page.locator('.fd-teams__formation > summary').click();
      await expect(f.page.locator('[data-team-season]')).toHaveValue('b');
      await f.page.locator('[data-team-name]').fill('Synthetic team');
      await f.page.locator('[data-team-formation-form] button').click();
      await expect(f.page.locator('[data-team-formation-items]')).toContainText('Synthetic team');
      expect(f.writes).toEqual([{ path: '/api/seasons/b/team-applications', body: { teamName: 'Synthetic team' } }]);
      await expect(f.page.locator('[data-team-formation-form] button')).toBeDisabled();
    } finally { await f.context.close(); }
  });

  for (const query of ['?season=unknown', '?season=', '?season=b&season=a', '?season=closed']) {
    test(`modern Teams unavailable target ${query} blocks other-season application (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
      const f = await open(browser, mobile, query);
      try {
        await expect(f.page.locator('[data-team-season]')).toHaveValue('');
        await expect(f.page.locator('[data-team-formation-form] button')).toBeDisabled();
        await expect(f.page.locator('[data-team-season-help]')).toContainText('requested season');
        await expect(f.page.locator('[data-team-season-current]')).toHaveAttribute('href', '/teams');
        expect(f.writes).toEqual([]);
        await f.page.locator('[data-team-season]').selectOption('b');
        await expect(f.page).toHaveURL(/season=b$/);
        await expect(f.page.locator('[data-team-formation-form] button')).toBeEnabled();
        await f.page.reload();
        await expect(f.page.locator('[data-team-season]')).toHaveValue('b');
        expect(f.writes).toEqual([]);
      } finally { await f.context.close(); }
    });
  }

  test(`modern Teams deliberate season switch updates URL before applying (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=b&view=mine');
    try {
      await f.page.locator('[data-team-season]').selectOption('a');
      expect(new URL(f.page.url()).searchParams.get('season')).toBe('a');
      expect(new URL(f.page.url()).searchParams.get('view')).toBe('mine');
      await f.page.locator('[data-team-name]').fill('Synthetic team');
      await f.page.locator('[data-team-formation-form] button').click();
      await expect.poll(() => f.writes.length).toBe(1);
      expect(f.writes[0].path).toBe('/api/seasons/a/team-applications');
    } finally { await f.context.close(); }
  });

  test(`modern Teams already-applied explicit target cannot silently move application (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=b', { existing: true });
    try {
      await expect(f.page.locator('[data-team-formation-form] button')).toBeDisabled();
      await expect(f.page.locator('[data-team-formation-items]')).toContainText('Existing synthetic team');
      expect(f.writes).toEqual([]);
      await f.page.locator('[data-team-season-current]').click();
      await expect(f.page.locator('[data-team-season]')).toHaveValue('a');
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });

  test(`modern Teams default retains first available season (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '');
    try { await expect(f.page.locator('[data-team-season]')).toHaveValue('a'); expect(f.writes).toEqual([]); }
    finally { await f.context.close(); }
  });

  test(`modern Teams denial never replays an application (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=b', { denied: true });
    try {
      await f.page.locator('[data-team-name]').fill('Synthetic team');
      await f.page.locator('[data-team-formation-form] button').click();
      await expect(f.page.locator('[data-teams-state]')).toContainText('Application denied');
      expect(f.writes).toEqual([{ path: '/api/seasons/b/team-applications', body: { teamName: 'Synthetic team' } }]);
    } finally { await f.context.close(); }
  });

  test(`modern Teams signed-out target cannot apply (${mobile ? '320px' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, mobile, '?season=b', { signedOut: true });
    try { await expect(f.page.locator('[data-teams-content]')).toBeHidden(); expect(f.writes).toEqual([]); }
    finally { await f.context.close(); }
  });
}
