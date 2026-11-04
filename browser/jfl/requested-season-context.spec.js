import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { renderLineupPage } from '../../src/lineupPage.js';
import { renderAdminPlayersPage } from '../../src/adminPlayersPage.js';

const id = n => `32670000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const seasonA = id(1), seasonB = id(2), teamA = id(3), teamB = id(4), teamC = id(5);
const teams = [
  { teamId: teamA, teamName: 'Earlier team', seasonId: seasonA, seasonName: 'Earlier season' },
  { teamId: teamB, teamName: 'Requested team', seasonId: seasonB, seasonName: 'Requested season' },
  { teamId: teamC, teamName: 'Second requested team', seasonId: seasonB, seasonName: 'Requested season' },
].map((team,i) => ({ ...team,lineupRounds: [
  { roundId: id(10+i),roundNumber: 1,scheduledOn: '2026-11-11',tableNumber: 1,opponentName: 'Other team',teamMatchStatus: 'scheduled' },
  { roundId: id(30+i),roundNumber: 2,scheduledOn: '2026-11-18',tableNumber: 1,opponentName: 'Another team',teamMatchStatus: 'scheduled' },
] }));
const player = { playerId: id(20),displayName: 'Context candidate',hasLogin: true,userId: id(21),
  competitionEligible: true,currentSeasonId: seasonA,currentSeasonName: 'Earlier season',
  teams: [{ ...teams[1],role: 'player',membershipId: id(22) }] };

async function html(path) {
  if (process.env.PLAYWRIGHT_CONTEXT_HTML_DIR) {
    return readFileSync(join(process.env.PLAYWRIGHT_CONTEXT_HTML_DIR,path === '/lineup' ? 'lineup.html' : 'admin-players.html'),'utf8');
  }
  if (process.env.PLAYWRIGHT_CONTEXT_SOURCE === 'bundled') {
    const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));
    const filename = (config.env?.jfl?.main || config.main).split('/').pop();
    const { default: worker } = await import(new URL('../../dist/'+filename,import.meta.url).href);
    return (await worker.fetch(new Request('https://context.test'+path),{ ENVIRONMENT: 'jfl' },{})).text();
  }
  return path === '/lineup' ? renderLineupPage() : renderAdminPlayersPage();
}
async function open(browser,mobile,path,{ remembered = '',signedIn = true } = {}) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280,height: 900 },baseURL: 'https://context.test' });
  await context.addInitScript(({ remembered,signedIn }) => {
    if (location.origin !== 'https://context.test') return;
    if (signedIn) sessionStorage.setItem('fd.accessToken','synthetic-context-session');
    if (!localStorage.getItem('context-fixture-initialized')) {
      if (remembered) localStorage.setItem('fd.lineupTeamId',remembered);
      localStorage.setItem('context-fixture-initialized','1');
    }
  },{ remembered,signedIn });
  const page = await context.newPage(), requests = [], errors = [];
  page.on('pageerror',error => errors.push(error.message));
  await context.route('https://context.test/**',async route => {
    const request = route.request(), pathname = new URL(request.url()).pathname;
    if (['/lineup','/admin/players'].includes(pathname)) return route.fulfill({ contentType: 'text/html',body: await html(pathname) });
    if (!pathname.startsWith('/api/')) return route.fulfill({ status: 404,body: '' });
    requests.push({ path: pathname,method: request.method(),authorization: request.headers().authorization,
      body: request.postData() ? request.postDataJSON() : null });
    if (request.method() !== 'GET') return route.fulfill({ status: 403,contentType: 'application/json',body: JSON.stringify({ error: 'Synthetic write refused' }) });
    let body = {};
    if (pathname === '/api/me/teams') body = { teamManagement: { captain_teams: teams } };
    if (pathname.endsWith('/availability')) body = { availability: [] };
    if (pathname.endsWith('/lineup')) body = { lineups: [] };
    if (pathname === '/api/admin/players') body = { players: [player],rosterTeams: teams };
    return route.fulfill({ contentType: 'application/json',body: JSON.stringify(body) });
  });
  await page.goto(path);
  return { context,page,requests,errors };
}
async function selected(f,team,since = 0) {
  await expect(f.page.locator('[data-team-select]')).toHaveValue(team.teamId);
  await expect(f.page.locator('[data-round-select]')).toHaveValue(team.lineupRounds[0].roundId);
  await expect(f.page.locator('[data-workspace]')).toBeVisible();
  await expect(f.page.locator('[data-status]')).toHaveAttribute('data-tone','ok');
  expect(f.requests.slice(since).filter(r => r.path.startsWith('/api/teams/')).every(r => r.path.startsWith('/api/teams/'+team.teamId+'/'))).toBe(true);
  expect(f.requests.filter(r => r.path === '/api/me/teams' || r.path.startsWith('/api/teams/') || r.path.startsWith('/api/admin/players'))
    .every(r => r.authorization === 'Bearer synthetic-context-session')).toBe(true);
  expect(f.errors).toEqual([]);
  expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
}
async function addForfeit(f,mobile) {
  const mobileControl = f.page.getByRole('button',{ name: 'Forfeit',exact: true });
  if (mobile && await mobileControl.count()) await mobileControl.first().click();
  else await f.page.getByRole('button',{ name: 'Forfeit slot',exact: true }).first().click();
}

for (const mobile of [false,true]) {
  test.describe(mobile ? 'phone requested season' : 'desktop requested season',() => {
    for (const [name,path,remembered,team] of [
      ['season outranks remembered team','/lineup?season='+seasonB,teamA,teams[1]],
      ['explicit team remains authoritative','/lineup?season='+seasonB+'&team='+teamA,teamC,teams[0]],
      ['memory remains useful without URL context','/lineup',teamC,teams[2]],
      ['memory within requested season remains useful','/lineup?season='+seasonB,teamC,teams[2]],
      ['unknown remembered team cannot change season','/lineup?season='+seasonB,id(999),teams[1]],
      ['unavailable explicit team cannot request unauthorized team','/lineup?season='+seasonB+'&team='+id(999),teamA,teams[1]],
    ]) {
      test(name,async ({ browser }) => {
        const f = await open(browser,mobile,path,{ remembered });
        try {
          await selected(f,team);
          await f.page.reload(); await selected(f,team);
          expect(f.requests.filter(r => r.method !== 'GET')).toEqual([]);
        } finally { await f.context.close(); }
      });
    }
    test('unavailable season does not silently load another season and manual selection recovers',async ({ browser }) => {
      const f = await open(browser,mobile,'/lineup?season='+id(999),{ remembered: teamA });
      try {
        await expect(f.page.locator('[data-team-select]')).toHaveValue('');
        await expect(f.page.locator('[data-round-select]')).toBeDisabled();
        expect(f.requests.filter(r => r.path.startsWith('/api/teams/'))).toEqual([]);
        await f.page.locator('[data-team-select]').selectOption(teamB);
        await selected(f,teams[1]);
        await f.page.reload(); await selected(f,teams[1]);
        expect(f.requests.filter(r => r.method !== 'GET')).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('roster admin offers only unjoined teams in the URL season and preserves mutation context',async ({ browser }) => {
      const f = await open(browser,mobile,'/admin/players?season='+seasonB);
      try {
        await f.page.getByText('Manage player',{ exact: true }).click();
        const select = f.page.getByRole('combobox',{ name: 'Team to add Context candidate to' });
        await expect(select.locator('option')).toHaveText(['Second requested team']);
        const dialogPending = f.page.waitForEvent('dialog');
        const clicking = f.page.getByRole('button',{ name: 'Add to team',exact: true }).click();
        const dialog = await dialogPending;
        expect(dialog.message()).toBe('Confirm: add Context candidate to Second requested team?');
        await dialog.accept(); await clicking;
        await expect.poll(() => f.requests.filter(r => r.method !== 'GET').length).toBe(1);
        expect(f.requests.find(r => r.method !== 'GET')).toMatchObject({ authorization: 'Bearer synthetic-context-session',
          body: { operation: 'roster-membership',seasonId: seasonB,teamId: teamC } });
        await expect(f.page.locator('[data-status]')).toHaveText('Synthetic write refused');
        expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('manual team change clears the old draft and refresh preserves the deliberate choice',async ({ browser }) => {
      const f = await open(browser,mobile,'/lineup?season='+seasonA,{ remembered: teamA });
      try {
        await selected(f,teams[0]);
        await addForfeit(f,mobile);
        await expect(f.page.locator('[data-slot-count]')).toHaveText('1 / 3');
        const since = f.requests.length;
        await f.page.locator('[data-team-select]').selectOption(teamC);
        await selected(f,teams[2],since);
        await expect(f.page.locator('[data-slot-count]')).toHaveText('0 / 3');
        await f.page.reload(); await selected(f,teams[2],since);
        expect(new URL(f.page.url()).searchParams.get('season')).toBe(seasonB);
        expect(f.requests.filter(r => r.method !== 'GET')).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('signed-out lineup issues no captain or roster request',async ({ browser }) => {
      const f = await open(browser,mobile,'/lineup?season='+seasonB,{ signedIn: false,remembered: teamA });
      try {
        await expect(f.page.locator('[data-gate-title]')).toContainText('Sign in');
        await expect(f.page.locator('[data-context-controls]')).toBeHidden();
        expect(f.requests.filter(r => r.path === '/api/me/teams' || r.path.startsWith('/api/teams/') || r.path.startsWith('/api/admin/players'))).toEqual([]);
        expect(f.requests.filter(r => r.method !== 'GET')).toEqual([]); expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('manual week change loads that round, clears the old draft and survives refresh',async ({ browser }) => {
      const f = await open(browser,mobile,'/lineup?season='+seasonB,{ remembered: teamB });
      try {
        await selected(f,teams[1]);
        await addForfeit(f,mobile);
        const round = teams[1].lineupRounds[1],since = f.requests.length;
        await f.page.locator('[data-round-select]').selectOption(round.roundId);
        await selected(f,{ ...teams[1],lineupRounds: [round] },since);
        await expect(f.page.locator('[data-slot-count]')).toHaveText('0 / 3');
        expect(f.requests.slice(since).filter(r => r.path.endsWith('/availability')).every(r => r.path.includes('/rounds/'+round.roundId+'/'))).toBe(true);
        await f.page.reload(); await selected(f,{ ...teams[1],lineupRounds: [round] },since);
        expect(f.requests.filter(r => r.method !== 'GET')).toEqual([]);
      } finally { await f.context.close(); }
    });
  });
}
