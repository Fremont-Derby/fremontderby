import { renderAvailabilityPage as renderAvailabilityPageCore } from './availabilityPageCore.js';

export function renderAvailabilityPage() {
  return renderAvailabilityPageCore().replace(
    'data-date-list role="table" aria-label="Upcoming league nights"',
    'data-date-list data-register data-roster-status data-free-agent-status role="table" aria-label="Upcoming league nights"',
  );
}
