import test from 'node:test';
import assert from 'node:assert/strict';
import { adminSurvey, failedChecks, laneSafeBuild, publicSeasonSmoke, surveyApi } from '../src/smokeOps.js';

test('public season smoke needs a 200 and a season', () => {
  assert.equal(publicSeasonSmoke({ status: 200, season: 'Spring' }).ok, true);
  assert.equal(publicSeasonSmoke({ status: 500 }).ok, false);
});

test('failed checks are named', () => {
  assert.deepEqual(failedChecks([{ name: 'schedule', ok: false }, { name: 'home', ok: true }]), ['schedule']);
});

test('the survey API keeps the latest note', () => {
  assert.equal(surveyApi([{ note: 'clear' }]).latest, 'clear');
});

test('a lane build is not stamped as production', () => {
  assert.equal(laneSafeBuild({ lane: 'production' }).ok, false);
  assert.equal(laneSafeBuild({ lane: 'dru' }).ok, true);
});

test('survey rows are admin-only', () => {
  assert.equal(adminSurvey({ role: 'player' }, [{ note: 'x' }]).allowed, false);
  assert.equal(adminSurvey({ role: 'admin' }, [{ note: 'x' }]).rows.length, 1);
});
