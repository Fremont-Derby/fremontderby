import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifiedSendWait, qualifyConversationReadback, sendWithQualifiedRecovery } from '../browser/jfl/synthetic-send-recovery.js';

test('known rejection waits and proves absence before authorizing one new UI action', async () => {
  const events = [];
  let sends = 0;
  const result = await sendWithQualifiedRecovery({
    send: async () => { events.push('send'); return ++sends === 1 ? { status: 429, retryAfter: '10' } : { status: 201 }; },
    wait: async ms => { events.push('wait:' + ms); }, markerAbsent: async () => { events.push('read-both'); return true; },
    authorizeRetry: () => events.push('authorize'), onResponse: value => events.push('status:' + value.status),
  });
  assert.equal(result.status, 201);
  assert.deepEqual(events, ['send', 'status:429', 'wait:11000', 'read-both', 'authorize', 'send', 'status:201']);
});
for (const status of [0, 200, 201, 400, 401, 403, 409, 500, 503]) test(`HTTP${status} never authorizes another send`, async () => {
  let sends = 0;
  const result = await sendWithQualifiedRecovery({ send: async () => { sends++; return { status, retryAfter: '10' }; },
    wait: () => assert.fail('must not wait'), markerAbsent: () => assert.fail('must not read'), authorizeRetry: () => assert.fail('must not authorize') });
  assert.equal(result.status, status); assert.equal(sends, 1);
});
test('network uncertainty never authorizes another send', async () => {
  let sends = 0;
  await assert.rejects(sendWithQualifiedRecovery({ send: async () => { sends++; throw new Error('network'); },
    wait: () => assert.fail('must not wait'), markerAbsent: () => assert.fail('must not read'), authorizeRetry: () => assert.fail('must not authorize') }));
  assert.equal(sends, 1);
});
for (const value of ['', '0', '-1', '1.5', '0x10', '61', 'junk', 'Sun, 25 Oct 2026 11:59:59 GMT']) test(`unqualified wait ${value || 'missing'} fails closed`, async () => {
  assert.throws(() => qualifiedSendWait(value, Date.parse('2026-10-25T12:00:00Z')), /unqualified/);
});
test('qualified HTTP-date is bounded against current time', () => {
  assert.equal(qualifiedSendWait('Sun, 25 Oct 2026 12:00:10 GMT', Date.parse('2026-10-25T12:00:00Z')), 10);
});
for (const retryAfter of ['', '0', 'invalid', '61']) test(`429 with unqualified header ${retryAfter || 'missing'} cannot reach wait/read/replay`, async () => {
  let sends = 0;
  await assert.rejects(sendWithQualifiedRecovery({ send: async () => { sends++; return { status: 429, retryAfter }; },
    wait: () => assert.fail('unqualified wait'), markerAbsent: () => assert.fail('must not read'),
    authorizeRetry: () => assert.fail('must not authorize') }), /unqualified/);
  assert.equal(sends, 1);
});
for (const absent of [false, undefined, null, 'true']) test(`only confirmed boolean absence permits another send (${String(absent)})`, async () => {
  let sends = 0;
  await assert.rejects(sendWithQualifiedRecovery({ send: async () => { sends++; return { status: 429, retryAfter: '1' }; },
    wait: async () => {}, markerAbsent: async () => absent, authorizeRetry: () => assert.fail('must not authorize') }), /requires cleanup/);
  assert.equal(sends, 1);
});
test('readback failure stops without authorizing replay', async () => {
  let sends = 0;
  await assert.rejects(sendWithQualifiedRecovery({ send: async () => { sends++; return { status: 429, retryAfter: '1' }; },
    wait: async () => {}, markerAbsent: async () => { throw new Error('read failed'); }, authorizeRetry: () => assert.fail('must not authorize') }));
  assert.equal(sends, 1);
});
test('three confirmed rejections exhaust the budget without an extra wait/action', async () => {
  let sends = 0, waits = 0, authorizations = 0;
  await assert.rejects(sendWithQualifiedRecovery({ send: async () => { sends++; return { status: 429, retryAfter: '1' }; },
    wait: async () => { waits++; }, markerAbsent: async () => true, authorizeRetry: () => { authorizations++; } }), /exhausted/);
  assert.deepEqual([sends, waits, authorizations], [3, 2, 2]);
});

const fixture = { season: '11111111-1111-4111-8111-111111111111', sender: '22222222-2222-4222-8222-222222222222', recipient: '33333333-3333-4333-8333-333333333333' };
const conversation = '44444444-4444-4444-8444-444444444444';
const outgoing = { conversation_id: conversation, season_id: fixture.season, other_player_id: fixture.recipient, can_send: true };
const incoming = { ...outgoing, other_player_id: fixture.sender };
test('both inboxes agree on the exact mutually writable conversation', () => {
  assert.equal(qualifyConversationReadback([outgoing], [incoming], fixture), conversation);
  assert.deepEqual(qualifyConversationReadback([], [], fixture), null);
});
for (const [name, sender, recipient] of [
  ['asymmetric existence', [outgoing], []],
  ['duplicate target', [outgoing, outgoing], [incoming]],
  ['inconsistent conversation', [outgoing], [{ ...incoming, conversation_id: fixture.sender }]],
  ['wrong season on one side', [outgoing], [{ ...incoming, season_id: fixture.recipient }]],
  ['sender blocked', [{ ...outgoing, can_send: false }], [incoming]],
  ['recipient blocked', [outgoing], [{ ...incoming, can_send: false }]],
  ['missing rows', undefined, [incoming]],
  ['invalid unrelated row', [outgoing, {}], [incoming]],
  ['invalid conversation identity', [outgoing], [{ ...incoming, conversation_id: '-'.repeat(36) }]],
  ['malformed permission', [outgoing], [{ ...incoming, can_send: 'true' }]],
]) test(`conversation ${name} cannot qualify a new start`, () => {
  assert.throws(() => qualifyConversationReadback(sender, recipient, fixture));
});
test('conversation readback refuses an unqualified or same-person fixture', () => {
  assert.throws(() => qualifyConversationReadback([], [], { ...fixture, sender: fixture.recipient }));
  assert.throws(() => qualifyConversationReadback([], [], { ...fixture, season: '' }));
});
