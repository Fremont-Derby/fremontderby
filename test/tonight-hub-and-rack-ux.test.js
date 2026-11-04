import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import {
  sharedRackLedgerScorecardControllerSource,
} from '../src/rackLedgerScorecard.js';

test('live rack adapter never replays an uncertain scoring write', async () => {
  let calls=0;
  const context={URLSearchParams,location:{search:'?match=match&team=team'},
    sessionStorage:{getItem:()=> 'session'},document:{querySelector:()=>null},window:{},
    fetch:async()=>{calls++;throw new Error('connection lost after dispatch')},
  };
  vm.runInNewContext(liveRackLedgerAdapterSource,context);
  await assert.rejects(context.window.fdRackLedgerAdapter.saveRack({winnerSide:'A'}),/connection lost/);
  assert.equal(calls,1);
});

test('teams league-night hub includes schedule and dynamic score card hooks', () => {
  const html = renderTeamsPage();
  assert.match(html, /data-hub-score-title/);
  assert.match(html, /data-hub-schedule/);
  assert.match(html, /Tonight/);
  assert.match(html, /scorable-matches/);
});

test('rack ledger mismatch copy explains dual-score disagreement', () => {
  assert.match(sharedRackLedgerScorecardControllerSource, /Both teams submitted different winners/);
  assert.match(sharedRackLedgerScorecardControllerSource, /Agree on the table result/);
  assert.match(sharedRackLedgerScorecardControllerSource, /aria-label','Record rack/);
});
