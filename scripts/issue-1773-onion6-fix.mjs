import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const teamsPath = 'src/jflModernTeams.js';
const testsPath = 'test/jfl-modern-teams.test.js';

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing expected source block: ${label}`);
  return source.replace(before, after);
}

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

let tests = fs.readFileSync(testsPath, 'utf8');

tests = replaceOnce(
  tests,
  "      { teamId: 'team-other', teamName: 'Rail Riders', seasonId: 'season-active', seasonName: 'Active League Lab', captainName: 'Casey Captain' },",
  "      {\n        teamId: 'team-other',\n        teamName: 'Rail Riders',\n        seasonId: 'season-active',\n        seasonName: 'Active League Lab',\n        captainName: 'Casey Captain',\n        rosterCount: 2,\n        roster: [\n          { playerId: 'player-captain-other', displayName: 'Casey Captain', role: 'captain' },\n          { playerId: 'player-other', displayName: 'Pat Player', role: 'player' },\n        ],\n      },",
  'directory fixture roster',
);

tests = replaceOnce(
  tests,
  "  assert.match(directoryHtml, /fd-team-card__facts--single/);\n  assert.doesNotMatch(directoryHtml, />Roster</);\n  assert.doesNotMatch(directoryHtml, /Roster details/);\n  assert.doesNotMatch(directoryHtml, /Shown after joining|Request to join|Manage roster|Roster & captain|<details/);",
  "  assert.doesNotMatch(directoryHtml, /League team/);\n  assert.match(directoryHtml, />Roster</);\n  assert.match(directoryHtml, /2 players/);\n  assert.match(directoryHtml, /<details/);\n  assert.match(directoryHtml, /View players/);\n  assert.match(directoryHtml, /Casey Captain/);\n  assert.match(directoryHtml, /Pat Player/);\n  assert.doesNotMatch(directoryHtml, /Request to join|Manage roster/);",
  'directory card acceptance',
);

tests = replaceOnce(
  tests,
  "  assert.match(html, /captainName:\\s*row\\.captain_display_name/);",
  "  assert.match(html, /captainName:\\s*row\\.captain_display_name/);\n  assert.match(html, /rosterCount:\\s*row\\.roster_count/);\n  assert.match(html, /roster:\\s*Array\\.isArray\\(row\\.roster\\)/);\n  assert.match(html, /searchParams\\.get\\('view'\\)/);\n  assert.match(html, /history\\.replaceState/);",
  'browser data and filter persistence contract',
);

fs.writeFileSync(testsPath, tests);

let redFailed = false;
try {
  run('node', ['--test', testsPath]);
} catch {
  redFailed = true;
}
if (!redFailed) throw new Error('RED proof failed: acceptance tests unexpectedly passed before implementation');
console.log('RED confirmed: new Onion 6 acceptance tests fail before implementation.');

let teams = fs.readFileSync(teamsPath, 'utf8');

teams = replaceOnce(
  teams,
  "        : (team.relationship === 'directory' ? '<span class=\"fd-team-card__directory\">League team</span>' : '')));",
  "        : ''));",
  'remove directory badge',
);

teams = replaceOnce(
  teams,
  "  const rosterDetails = ['captain', 'member'].includes(team.relationship)\n    ? `<details class=\"fd-team-card__details\"><summary>${team.relationship === 'captain' ? 'Manage roster' : 'View roster'}</summary>${rosterMarkup(team)}</details>`\n    : '';",
  "  const canViewRoster = ['captain', 'member'].includes(team.relationship) || hasRosterCount;\n  const rosterDetails = canViewRoster\n    ? `<details class=\"fd-team-card__details\"><summary>${team.relationship === 'captain' ? 'Manage roster' : 'View players'}</summary>${rosterMarkup(team)}</details>`\n    : '';",
  'server-rendered roster expansion',
);

teams = replaceOnce(
  teams,
  "  .fd-teams__filters button[aria-pressed=\"true\"] { border: 3px solid #012f1d; background: var(--fd-teams-green-dark); color: #fff; box-shadow: 0 3px 8px rgba(3,60,37,.28); }",
  "  .fd-teams__filters button[aria-pressed=\"true\"] { border: 3px solid #011d12 !important; background: var(--fd-teams-green-dark) !important; color: #fff !important; box-shadow: 0 0 0 3px #b8d9c7, 0 4px 10px rgba(3,60,37,.34); }\n  .fd-teams__filters button[aria-pressed=\"true\"]::before { content: '✓ '; font-weight: 1000; }",
  'selected filter contrast',
);

teams = replaceOnce(
  teams,
  "      let filter = sessionStorage.getItem(filterKey) || 'all';",
  "      const initialUrl = new URL(location.href);\n      let filter = initialUrl.searchParams.get('view') || sessionStorage.getItem(filterKey) || 'all';",
  'filter URL initialization',
);

teams = replaceOnce(
  teams,
  "        else if (team.relationship === 'directory') relWrap.append(node('span', 'fd-team-card__directory', 'League team'));",
  "        else if (team.relationship === 'directory') relWrap.textContent = '';",
  'client remove directory badge',
);

teams = replaceOnce(
  teams,
  "        if (team.relationship === 'captain' || team.relationship === 'member') {\n          const details = node('details', 'fd-team-card__details');\n          if (clean(openTeamId) === clean(team.teamId)) details.open = true;\n          const summary = document.createElement('summary'); summary.textContent = team.relationship === 'captain' ? 'Manage roster' : 'View roster';",
  "        if (team.relationship === 'captain' || team.relationship === 'member' || hasRosterCount) {\n          const details = node('details', 'fd-team-card__details');\n          if (clean(openTeamId) === clean(team.teamId)) details.open = true;\n          const summary = document.createElement('summary'); summary.textContent = team.relationship === 'captain' ? 'Manage roster' : 'View players';",
  'client roster expansion',
);

teams = replaceOnce(
  teams,
  "              captainName: row.captain_display_name || '',\n              relationship: 'directory',",
  "              captainName: row.captain_display_name || '',\n              rosterCount: Number.isFinite(Number(row.roster_count)) ? Number(row.roster_count) : null,\n              roster: Array.isArray(row.roster) ? row.roster : [],\n              relationship: 'directory',",
  'directory roster data mapping',
);

teams = replaceOnce(
  teams,
  "        filter = control.dataset.teamFilter;\n        sessionStorage.setItem(filterKey, filter);\n        syncFilterControls();",
  "        filter = control.dataset.teamFilter;\n        sessionStorage.setItem(filterKey, filter);\n        const nextUrl = new URL(location.href);\n        nextUrl.searchParams.set('view', filter);\n        history.replaceState(null, '', nextUrl);\n        syncFilterControls();",
  'filter persistence on click',
);

fs.writeFileSync(teamsPath, teams);

run('node', ['--test', testsPath, 'test/standings-repository.test.js']);
run('npm', ['run', 'lint']);
run('npm', ['run', 'check']);
run('npm', ['test']);

run('git', ['config', 'user.name', 'github-actions[bot]']);
run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
run('git', ['add', teamsPath, testsPath]);
run('git', ['commit', '-m', 'fix: finish Onion 6 team roster UX']);
run('git', ['push', 'origin', 'HEAD:jfl/issue-1773-roster-expand-filter']);
