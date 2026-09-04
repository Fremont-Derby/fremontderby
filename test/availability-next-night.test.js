import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAvailabilityScript } from '../src/availabilityScriptRepair.js';

test('availability repair prefers an upcoming scheduled night', () => {
  const source = "const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";
  const repaired = repairAvailabilityScript(source);
  assert.match(repaired, /upcoming/);
  assert.match(repaired, /scheduledOn/);
});
