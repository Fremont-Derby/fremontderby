import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  QA_EVIDENCE_SCHEMA_VERSION,
  findQaEvidencePrivacyViolations,
  normalizeQaError,
  validateQaEvidence,
} from '../src/qaEvidenceContract.js';

const examples = JSON.parse(await readFile(new URL('./fixtures/qa-evidence-v1.examples.json', import.meta.url)));
const schema = JSON.parse(await readFile(new URL('../schemas/qa-evidence-v1.schema.json', import.meta.url)));

test('v1 JSON schema is machine-readable and matches the executable contract version', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.schema_version.const, QA_EVIDENCE_SCHEMA_VERSION);
  assert.equal(schema.properties.lane.const, 'jfl');
  assert.ok(schema.required.includes('build_sha'));
  assert.ok(schema.required.includes('assertions'));
});

test('examples cover required outcomes and all validate', () => {
  for (const example of examples) assert.deepEqual(validateQaEvidence(example), { valid: true, errors: [] });
  assert.ok(examples.some((row) => row.outcome === 'pass' && !row.replay_of_run_id));
  assert.ok(examples.some((row) => row.outcome === 'fail' && row.events.length === 0));
  assert.ok(examples.some((row) => row.events.some((event) => event.type === 'client_error')));
  assert.ok(examples.some((row) => row.events.some((event) => event.type === 'server_error' && event.correlation_id)));
  assert.ok(examples.some((row) => row.outcome === 'pass' && row.replay_of_run_id));
});

test('contract fails closed outside JFL and requires exact build identity', () => {
  const wrongLane = structuredClone(examples[0]);
  wrongLane.lane = 'production';
  assert.match(validateQaEvidence(wrongLane).errors.join('\n'), /lane must be jfl/);
  const shortSha = structuredClone(examples[0]);
  shortSha.build_sha = 'abc123';
  assert.match(validateQaEvidence(shortSha).errors.join('\n'), /exact 40-character Git SHA/);
});

test('privacy guard rejects credentials, email, phone, query strings, and randomized names', () => {
  const unsafe = structuredClone(examples[0]);
  unsafe.authorization = 'Bearer secret-token';
  unsafe.note = 'Email person@example.com or call +1 (206) 555-0100';
  unsafe.events[0].route = 'https://jfl.example/qa?token=secret';
  unsafe.fixture_facts.team_name = 'Randomized Sharks';
  const violations = findQaEvidencePrivacyViolations(unsafe).join('\n');
  assert.match(violations, /authorization: forbidden field/);
  assert.match(violations, /email address/);
  assert.match(violations, /phone-like value/);
  assert.match(violations, /query string/);
  assert.match(violations, /team_name: forbidden field/);
  assert.equal(validateQaEvidence(unsafe).valid, false);
});

test('events accept allowlisted fields only', () => {
  const unsafe = structuredClone(examples[0]);
  unsafe.events[0].page_text = 'entire page';
  assert.match(validateQaEvidence(unsafe).errors.join('\n'), /page_text is not allowlisted/);
});

test('error normalization removes volatile identifiers before fingerprinting', async () => {
  const first = await normalizeQaError({
    name: 'TypeError',
    message: 'Failed run 123456 for 5c64f8a1-2c6e-4f8f-9dad-79f0303a7d0d?token=one',
    route: '/api/runs/123456?token=one',
    action: 'save_result',
    stack_location: 'qa.js:44:8',
  });
  const second = await normalizeQaError({
    name: 'TypeError',
    message: 'Failed run 987654 for 2b657790-03a1-43cf-8aa2-9577e62bc418?token=two',
    route: '/api/runs/987654?token=two',
    action: 'save_result',
    stack_location: 'qa.js:99:2',
  });
  assert.equal(first.fingerprint, second.fingerprint);
  assert.doesNotMatch(JSON.stringify(first), /123456|token=one|5c64f8a1/);
});
