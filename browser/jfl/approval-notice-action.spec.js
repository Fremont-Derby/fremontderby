import { test, expect } from '@playwright/test';
import { renderJflModernTeams } from '../../src/jflModernTeams.js';
import { renderJflNotificationsPage } from '../../src/jflNotificationsPage.js';

test.setTimeout(45_000);
const seasonId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const teamId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const noticeId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const pages = {};
test.beforeAll(async ({ request }) => {
  const mode = process.env.PLAYWRIGHT_APPROVAL_NOTICE_HTML;
  if (mode === 'raw') {
    pages['/notifications'] = renderJflNotificationsPage();
    pages['/teams'] = renderJflModernTeams();
    return;
  }
  if (mode === 'deployed') {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({ ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    for (const path of ['/notifications', '/teams']) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      if (path === '/teams') expect(response.headers()['x-fremont-ui-mode']).toBe('modern-teams-v1');
      pages[path] = await response.text();
    }
    return;
  }
  const { default: worker } = await import('../../dist/routerEntry.js');
  for (const path of ['/notifications', '/teams']) {
    const response = await worker.fetch(new Request('https://jfl.fremontderby.com' + path), { ENVIRONMENT: 'jfl' }, { waitUntil() {} });
    expect(response.status).toBe(200);
    if (path === '/teams') expect(response.headers.get('x-fremont-ui-mode')).toBe('modern-teams-v1');
    pages[path] = await response.text();
  }
});

// UI/action contract, all API/session data intercepted. Actual producer and
// recipient/transaction behavior have separate PostgreSQL and hosted proof.
for (const mobile of [false, true]) for (const nameStyle of ['ordinary', 'literal markup', '80 unbroken characters']) {
  test(`approval Notice opens recipient-owned teams and retains read state (${mobile ? '320px' : 'desktop'}, ${nameStyle})`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
    try {
      await context.addInitScript(() => {
        if (location.hostname === 'jfl.fremontderby.com') sessionStorage.setItem('fd.accessToken', 'synthetic-approval-recipient');
      });
      const teamName = nameStyle === 'literal markup' ? '<img src=x onerror="window.__approvalNoticeInjected=1">' : nameStyle === '80 unbroken characters' ? 'A'.repeat(80) : 'Approved synthetic team';
      const seasonName = nameStyle === 'literal markup' ? '<script>unsafe season</script>' : 'Synthetic registration season';
      let readAt = null;
      const writes = [];
      const approved = { teamId, teamName, seasonId, seasonName, roster: [{ playerId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', displayName: 'Synthetic recipient captain', role: 'captain' }] };
      await context.route('**/*', route => {
        const req = route.request(), path = new URL(req.url()).pathname;
        if (pages[path]) return route.fulfill({ contentType: 'text/html', body: pages[path] });
        if (req.method() !== 'GET') {
          writes.push({ path, method: req.method() });
          if (path === '/api/me/notifications/' + noticeId + '/read') {
            readAt = '2026-10-26T12:00:00.000Z';
            return route.fulfill({ json: { notification: { id: noticeId, readAt } } });
          }
          return route.fulfill({ status: 403, json: { error: 'No other controlled mutation is authorized' } });
        }
        if (path === '/api/me/notifications') return route.fulfill({ json: { notifications: [{ id: noticeId, kind: 'team_application_approved', title: 'Team application approved',
          body: teamName + ' in ' + seasonName + ' is approved. View your teams to finish preparing your roster.', href: '/teams?view=mine', readAt, createdAt: '2026-10-26T11:00:00.000Z' }] } });
        if (path === '/api/me/teams') return route.fulfill({ json: { teamManagement: { captain_teams: [approved, { ...approved, teamId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', teamName: 'My other season team', seasonName: 'Other season' }], players: [], invitations: [] } } });
        if (path === '/api/me/team-membership-requests') return route.fulfill({ json: { requests: { joinable_teams: [{ team_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', team_name: 'Unrelated public team', season_id: seasonId, season_name: seasonName }] } } });
        if (path === '/api/seasons') return route.fulfill({ json: { seasons: [{ id: seasonId, name: seasonName, status: 'registration' }] } });
        if (path.endsWith('/team-registration/me')) return route.fulfill({ json: { registration: { applications: [{ proposedTeamName: teamName, status: 'approved_pending_roster' }] } } });
        return route.fulfill({ json: {} });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      await page.goto('https://jfl.fremontderby.com/notifications');
      await expect(page.locator('.notice-card')).toHaveCount(1);
      await expect(page.locator('.notice-card')).toContainText(teamName + ' in ' + seasonName);
      expect(await page.locator('.notice-card img, .notice-card script').count()).toBe(0);
      expect(await page.evaluate(() => window.__approvalNoticeInjected)).toBeUndefined();
      await page.getByRole('button', { name: 'Mark read', exact: true }).click();
      await expect(page.locator('.notice-card')).toHaveAttribute('data-unread', 'false');
      await page.reload();
      await expect(page.locator('.notice-card')).toHaveAttribute('data-unread', 'false');
      await expect(page.getByRole('link', { name: 'Open related page', exact: true })).toHaveAttribute('href', '/teams?view=mine');
      await page.getByRole('link', { name: 'Open related page', exact: true }).click();
      expect(new URL(page.url()).searchParams.get('view')).toBe('mine');
      await expect(page.locator('[data-team-filter="mine"]')).toHaveAttribute('aria-pressed', 'true');
      const card = page.locator('[data-my-team-list] [data-team-id="' + teamId + '"]');
      await expect(card.getByRole('heading', { name: teamName, exact: true })).toBeVisible();
      await expect(card).toContainText(seasonName);
      await expect(page.locator('[data-team-directory]')).not.toContainText('Unrelated public team');
      await card.locator('summary').click();
      await expect(card).toContainText('Synthetic recipient captain');
      expect(await card.locator('img, script').count()).toBe(0);
      expect(await page.evaluate(() => window.__approvalNoticeInjected)).toBeUndefined();
      expect(await card.locator('h2').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect(await card.locator('.fd-team-card__head p').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (mobile && process.env.PLAYWRIGHT_APPROVAL_NOTICE_HTML !== 'raw') expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(writes).toEqual([{ path: '/api/me/notifications/' + noticeId + '/read', method: 'POST' }]);
    } finally { await context.close(); }
  });
}
