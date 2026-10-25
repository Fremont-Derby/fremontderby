import { test, expect } from '@playwright/test';
import { renderJflModernTeams } from '../../src/jflModernTeams.js';

const sourceMode = process.env.PLAYWRIGHT_TEAMS_SOURCE === '1';
const secret = 'synthetic-private-backend-detail';
const team = { teamId: 'synthetic-team', teamName: 'Synthetic captain team', seasonId: 'active', seasonName: 'Synthetic season',
  roster: [{ playerId: 'synthetic-captain', displayName: 'Synthetic captain', role: 'captain' }] };

async function openTeams(browser, request, mobile, initialFailure = null, directoryFailure = null) {
  const hasDirectory = directoryFailure !== null;
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({ ok: true, environment: 'jfl',
      expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'https://teams.test' :
    process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com',
  viewport: { width: mobile ? 320 : 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => {
    sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    window.__heldTeamBodies = [];
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (String(args[0]).includes('/api/me/teams')) {
        const text = response.text.bind(response);
        response.text = async () => {
          const body = await text();
          if (window.__holdTeamBody) await new Promise(resolve => window.__heldTeamBodies.push(resolve));
          return body;
        };
      }
      return response;
    };
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') });
  let failure = initialFailure, mutationFailure = null, hold = false, holdMutation = false;
  const held = [], heldWrites = [], reads = [], writes = [];
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const respond = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (route.request().method() !== 'GET') {
      writes.push({ path, body: route.request().postDataJSON() });
      expect(path, 'Every mutation is synthetic and intercepted').toBe('/api/team-invitations/synthetic-invitation/respond');
      if (holdMutation) { holdMutation = false; heldWrites.push(route); return; }
      if (mutationFailure) { const rejected = mutationFailure; mutationFailure = null; return route.fulfill(rejected); }
      return respond({});
    }
    reads.push(path);
    if (path === '/api/me/teams') {
      if (hold) { hold = false; held.push(route); return; }
      if (failure) { const rejected = failure; failure = null; return route.fulfill(rejected); }
      const currentTeam = route.request().headers().authorization === 'Bearer synthetic-B' ? { ...team, teamName: 'New session team' } : team;
      return respond({ teamManagement: { captain_teams: [currentTeam], invitations: [
        { invitationId: 'synthetic-invitation', teamName: 'Synthetic invitation' },
      ] } });
    }
    if (path === '/api/me/team-membership-requests') return respond({ requests: { joinable_teams: [] } });
    if (path === '/api/seasons') return respond({ seasons: [{ id: 'synthetic-registration', name: 'Synthetic registration', status: 'registration' },
      ...(hasDirectory ? [{ id: 'synthetic-active', name: 'Synthetic active season', status: 'active' }] : [])] });
    if (path.endsWith('/team-standings')) {
      if (directoryFailure) { const rejected = directoryFailure; directoryFailure = null; return route.fulfill(rejected); }
      return respond({ standings: [{ team_id: 'synthetic-directory-team', team_name: 'Recovered league team', roster_count: 3 }] });
    }
    if (path.endsWith('/team-registration/me')) return respond({ registration: { applications: [] } });
    if (path.endsWith('/teams')) return respond({ teams: [] });
    if (path === '/api/me/message-notification-summary') return respond({ unreadCount: 0, previews: [] });
    return respond({});
  });
  if (sourceMode) await page.route('https://teams.test/teams', route => route.fulfill({ contentType: 'text/html', body: renderJflModernTeams() }));
  await page.goto('/teams');
  await expect.poll(async () => await page.locator('[data-teams-content]').isVisible()
    || await page.locator('[data-teams-status]').getAttribute('data-tone') === 'error').toBe(true);
  return { context, page, reads, writes, held, heldWrites, reload: page.locator('[data-teams-reload]'), state: page.locator('[data-teams-state]'),
    fail: value => { failure = value; }, failMutation: value => { mutationFailure = value; },
    hold: () => { hold = true; }, holdMutation: () => { holdMutation = true; }, readCount: () => reads.filter(path => path === '/api/me/teams').length };
}

for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  for (const [label, rejected] of [
    ['throttle', { status: 429, headers: { 'retry-after': '10' }, contentType: 'text/html', body: '<html>' + secret + '</html>' }],
    ['expired access', { status: 401, contentType: 'text/html', body: secret }],
    ['unavailable server', { status: 503, contentType: 'text/html', body: secret }],
    ['missing standings', { status: 200, contentType: 'application/json', body: '{}' }],
    ['wrong standings type', { status: 200, contentType: 'application/json', body: '{"standings":{}}' }],
    ['null standings row', { status: 200, contentType: 'application/json', body: '{"standings":[null]}' }],
    ['missing team identity', { status: 200, contentType: 'application/json', body: '{"standings":[{"team_id":"synthetic"}]}' }],
  ]) {
    test(`incomplete season directory is explicit and recovers without writes: ${label} (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile, null, rejected);
      try {
        expect(await f.state.getAttribute('data-tone'), 'Missing season reads must not become a complete directory').toBe('error');
        await expect(f.page.locator('[data-teams-content]')).toBeHidden();
        await expect(f.state).not.toContainText(secret);
        if (rejected.status === 401) {
          await expect(f.page.locator('[data-teams-sign-in]')).toBeVisible();
          await expect(f.reload).toBeHidden();
        } else {
          if (rejected.status === 429) {
            await expect(f.reload).toBeDisabled();
            const count = f.readCount();
            await f.page.clock.runFor(11_000);
            expect(f.readCount()).toBe(count);
          }
          await f.reload.click();
          await expect(f.page.locator('[data-team-directory]')).toContainText('Recovered league team');
          await expect(f.page.locator('[data-my-team-list]')).toContainText(team.teamName);
          expect(f.readCount()).toBe(2);
        }
        expect(f.writes).toEqual([]);
      } finally { await f.context.close(); }
    });
  }
  for (const header of ['10', 'Sun, 25 Oct 2026 12:00:10 GMT']) {
    test(`Teams HTML throttle is safe and explicit reload honors ${header === '10' ? 'seconds' : 'date'} (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile, { status: 429, headers: { 'retry-after': header },
        contentType: 'text/html', body: '<html>' + secret + '</html>' });
      try {
        await expect(f.state).not.toContainText(secret);
        await expect(f.state).toContainText('Too many requests');
        await expect(f.reload).toBeDisabled();
        const count = f.readCount();
        await f.page.clock.runFor(9_000);
        expect(f.readCount()).toBe(count);
        await expect(f.reload).toBeDisabled();
        await f.page.clock.runFor(1_100);
        await expect(f.reload).toBeEnabled();
        expect(f.readCount()).toBe(count);
        await f.reload.click();
        await expect(f.page.locator('[data-my-team-list]')).toContainText(team.teamName);
        await expect(f.state).toBeHidden();
        expect(f.readCount()).toBe(count + 1);
        expect(f.writes).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }

  for (const rejected of [
    { status: 200, contentType: 'text/html', body: '<html>' + secret + '</html>' },
    { status: 200, contentType: 'text/html', body: JSON.stringify({ teamManagement: { captain_teams: [], invitations: [] } }) },
    { status: 200, contentType: 'application/json', body: 'null' },
    { status: 200, contentType: 'application/json', body: '{}' },
    { status: 503, contentType: 'application/json', body: JSON.stringify({ error: '<b>' + secret + '</b>' }) },
    { status: 503, contentType: 'application/json', body: JSON.stringify({ error: secret }) },
  ]) {
    test(`Teams malformed or unavailable load recovers by reads only ${rejected.status}/${rejected.body.length} (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile, rejected);
      try {
        await expect(f.state).toBeVisible();
        await expect(f.state).not.toContainText(secret);
        await expect(f.reload).toBeEnabled();
        await f.reload.click();
        await expect(f.state).toBeHidden();
        await expect(f.page.locator('[data-my-team-list]')).toContainText(team.teamName);
        expect(f.writes).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }

  test(`confirmed invitation response and failed reload never replay the write (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      f.fail({ status: 429, headers: { 'retry-after': '10' }, body: '{}' });
      await f.page.getByRole('button', { name: 'Accept', exact: true }).click();
      await expect(f.state).toBeVisible();
      await expect(f.page.locator('[data-teams-status]')).toContainText('saved');
      expect(f.writes).toHaveLength(1);
      await f.page.clock.runFor(10_100);
      expect(f.writes).toHaveLength(1);
      await f.reload.click();
      await expect(f.state).toBeHidden();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  test(`manual reload preserves current form draft and filter (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      await f.page.getByRole('button', { name: 'My teams', exact: true }).click();
      await f.page.locator('[data-team-search]').fill('Synthetic');
      await f.page.getByText('Start or return a team', { exact: true }).click();
      await f.page.locator('[data-team-name]').fill('Unsubmitted synthetic draft');
      f.fail({ status: 503, body: '{}' });
      await f.reload.click();
      await expect(f.state).toBeVisible();
      await f.reload.click();
      await expect(f.state).toBeHidden();
      await expect(f.page.locator('[data-team-name]')).toHaveValue('Unsubmitted synthetic draft');
      await expect(f.page.locator('[data-team-search]')).toHaveValue('Synthetic');
      await expect(f.page.locator('[data-team-filter="mine"]')).toHaveAttribute('aria-pressed', 'true');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  for (const header of [null, 'invalid-date', '999999']) {
    test(`unknown Teams wait ${header || 'missing'} requires explicit read without a guessed timer (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile, { status: 429, headers: header ? { 'retry-after': header } : {}, body: '{}' });
      try {
        await expect(f.state).toContainText('Please wait');
        await expect(f.reload).toBeEnabled();
        const count = f.readCount();
        await f.page.clock.runFor(300_000);
        expect(f.readCount()).toBe(count);
        await f.reload.click();
        await expect(f.state).toBeHidden();
        expect(f.writes).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }

  for (const status of [401, 403]) {
    test(`Teams ${status} retains the appropriate access boundary (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile, { status, contentType: 'application/json',
        body: JSON.stringify({ error: status === 403 ? 'This team action requires league access.' : secret }) });
      try {
        await expect(f.state).toBeVisible();
        await expect(f.state).not.toContainText(secret);
        if (status === 401) {
          await expect(f.page.locator('[data-teams-sign-in]')).toBeVisible();
          await expect(f.reload).toBeHidden();
        } else await expect(f.state).toContainText('requires league access');
        expect(f.writes).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }

  for (const status of [200, 503]) {
  test(`unconfirmed mutation ${status} outcome reloads without another mutation (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      f.failMutation(status === 200 ? { status, contentType: 'text/html', body: '<html>' + secret + '</html>' }
        : { status, contentType: 'application/json', body: JSON.stringify({ error: secret }) });
      await f.page.getByRole('button', { name: 'Accept', exact: true }).click();
      await expect(f.state).toContainText('Could not confirm');
      await expect(f.state).not.toContainText(secret);
      await expect(f.page.locator('[data-teams-status]')).not.toContainText('saved');
      expect(f.writes).toHaveLength(1);
      await f.reload.click();
      await expect(f.state).toBeHidden();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });
  }

  test(`Teams reload stays single-flight while its read is pending (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      f.hold(); await f.reload.click();
      await expect.poll(() => f.held.length).toBe(1);
      const count = f.readCount();
      for (let i = 0; i < 3; i++) await f.reload.dispatchEvent('click');
      await f.page.clock.runFor(1_000);
      expect(f.readCount()).toBe(count);
      await f.held[0].fulfill({ contentType: 'application/json', body: JSON.stringify({ teamManagement: { captain_teams: [team], invitations: [] } }) });
      await expect(f.state).toBeHidden();
      await expect(f.reload).toBeEnabled();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`pending mutation blocks duplicate actions and premature reload (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      f.holdMutation();
      await f.page.getByRole('button', { name: 'Accept', exact: true }).click();
      await expect.poll(() => f.heldWrites.length).toBe(1);
      await expect(f.reload).toBeDisabled();
      const reads = f.readCount();
      await f.page.getByRole('button', { name: 'Decline', exact: true }).click();
      await f.reload.dispatchEvent('click');
      await f.page.clock.runFor(1_000);
      expect(f.writes).toHaveLength(1);
      expect(f.readCount()).toBe(reads);
      await f.heldWrites[0].fulfill({ contentType: 'application/json', body: '{}' });
      await expect(f.page.locator('[data-teams-status]')).toContainText('saved');
      await expect(f.reload).toBeEnabled();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  test(`delayed Teams body cannot restore the earlier session (${device})`, async ({ browser, request }) => {
    const f = await openTeams(browser, request, mobile);
    try {
      await f.page.evaluate(() => { window.__holdTeamBody = true; });
      await f.reload.click();
      await expect.poll(() => f.page.evaluate(() => window.__heldTeamBodies.length)).toBe(1);
      await f.page.evaluate(() => {
        window.__holdTeamBody = false;
        sessionStorage.setItem('fd.accessToken', 'synthetic-B');
        window.dispatchEvent(new Event('fd:session-changed'));
      });
      await f.reload.click();
      await expect(f.page.locator('[data-my-team-list]')).toContainText('New session team');
      await f.page.evaluate(() => window.__heldTeamBodies.shift()());
      await f.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(f.page.locator('[data-my-team-list]')).toContainText('New session team');
      await expect(f.page.locator('[data-my-team-list]')).not.toContainText(team.teamName);
    } finally { await f.context.close(); }
  });

  for (const status of [200, 401]) {
    test(`old Teams ${status} response cannot overwrite the new session (${device})`, async ({ browser, request }) => {
      const f = await openTeams(browser, request, mobile);
      try {
        f.hold(); await f.reload.click();
        await expect.poll(() => f.held.length).toBe(1);
        await f.page.evaluate(() => {
          sessionStorage.setItem('fd.accessToken', 'synthetic-B');
          window.dispatchEvent(new Event('fd:session-changed'));
        });
        await expect(f.page.locator('[data-my-team-list]')).not.toContainText(team.teamName);
        await f.reload.click();
        await expect(f.page.locator('[data-my-team-list]')).toContainText('New session team');
        const done = f.page.waitForResponse(response => new URL(response.url()).pathname === '/api/me/teams' && response.status() === status);
        await f.held[0].fulfill({ status, contentType: 'application/json', body: JSON.stringify({ teamManagement: { captain_teams: [{ ...team, teamName: 'Old session team' }], invitations: [] } }) });
        await (await done).finished();
        await f.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(f.page.locator('[data-my-team-list]')).toContainText('New session team');
        await expect(f.page.locator('[data-my-team-list]')).not.toContainText('Old session team');
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-B');
      } finally { await f.context.close(); }
    });
  }
}
