import test from 'node:test';
import assert from 'node:assert/strict';

test('qaCaptainMissionFramingEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaCaptainMissionFramingEnhancer.js');
  const expected = ["routeQaCaptainMissionFrame","enhanceQaCaptainMissionFraming"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaCaptainMissionFramingEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaEvidenceContract.js loads and exports its named members', async () => {
  const mod = await import('../src/qaEvidenceContract.js');
  const expected = ["QA_EVIDENCE_SCHEMA_VERSION","QA_EVENT_FIELDS","FORBIDDEN_EVIDENCE_KEYS","normalizeQaError","findQaEvidencePrivacyViolations","validateQaEvidence"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaEvidenceContract.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaEvidenceHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/qaEvidenceHttp.js');
  const expected = ["createQaEvidenceHttp","routeQaEvidence"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaEvidenceHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaEvidenceRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/qaEvidenceRepository.js');
  const expected = ["createQaEvidenceRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaEvidenceRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaMissionCampaign.js loads and exports its named members', async () => {
  const mod = await import('../src/qaMissionCampaign.js');
  const expected = ["QA_MISSIONS","buildQaMissionFixture","routeQaMissionCampaign"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaMissionCampaign.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaMissionGameUxEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaMissionGameUxEnhancer.js');
  const expected = ["enhanceQaMissionGameUx"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaMissionGameUxEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaNextMatchMultiContext.js loads and exports its named members', async () => {
  const mod = await import('../src/qaNextMatchMultiContext.js');
  const expected = ["buildNextMatchMultiContext","routeQaNextMatchMultiContext","enhanceQaNextMatchHome"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaNextMatchMultiContext.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaNextMatchRecoveryEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaNextMatchRecoveryEnhancer.js');
  const expected = ["routeQaNextMatchRecovery","enhanceQaNextMatchRecovery"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaNextMatchRecoveryEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaPersonaEvidenceClient.js loads and exports its named members', async () => {
  const mod = await import('../src/qaPersonaEvidenceClient.js');
  const expected = ["renderPersonaEvidenceScript"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaPersonaEvidenceClient.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaPlayerAvailabilityMission.js loads and exports its named members', async () => {
  const mod = await import('../src/qaPlayerAvailabilityMission.js');
  const expected = ["buildPlayerAvailabilityFixture","activePlayerAvailabilityMission","routeQaPlayerAvailabilityMission","enhanceQaPlayerAvailabilityMission"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaPlayerAvailabilityMission.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
