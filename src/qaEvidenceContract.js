import { createHash } from 'node:crypto';

export const QA_EVIDENCE_SCHEMA_VERSION = '1.0.0';

export const QA_EVENT_FIELDS = Object.freeze({
  interaction: ['action', 'component', 'occurred_at', 'sequence'],
  client_error: ['error_class', 'message_template', 'route', 'action', 'stack_location', 'occurred_at', 'correlation_id'],
  server_error: ['status_family', 'route', 'action', 'occurred_at', 'correlation_id'],
});

export const FORBIDDEN_EVIDENCE_KEYS = Object.freeze([
  'authorization', 'cookie', 'headers', 'password', 'token', 'access_token',
  'refresh_token', 'email', 'phone', 'phone_number', 'page_text', 'message_content',
  'player_name', 'team_name',
]);

const RUN_OUTCOMES = new Set(['pass', 'fail', 'incomplete']);
const ASSERTION_OUTCOMES = new Set(['pass', 'fail', 'not_answered']);
const EVENT_TYPES = new Set(Object.keys(QA_EVENT_FIELDS));
const TRIAGE_LABELS = new Set(['untriaged', 'product_defect', 'test_defect', 'environment', 'expected_behavior', 'duplicate']);

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasRequiredString(value, key) {
  return typeof value[key] === 'string' && value[key].length > 0;
}

function collectKeys(value, prefix = '', output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectKeys(entry, `${prefix}[${index}]`, output));
    return output;
  }
  if (!plainObject(value)) return output;
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    output.push({ key: key.toLowerCase(), path, value: entry });
    collectKeys(entry, path, output);
  }
  return output;
}

export function normalizeQaError(error = {}) {
  const route = String(error.route || '')
    .split('?')[0]
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
  const messageTemplate = String(error.message_template || error.message || '')
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\b\d{4,}\b/g, ':number')
    .replace(/[?&][^\s]+/g, '')
    .slice(0, 240);
  const stackLocation = String(error.stack_location || '')
    .replace(/:\d+:\d+$/, ':line:column')
    .slice(0, 160);
  const normalized = {
    error_class: String(error.error_class || error.name || 'Error').slice(0, 80),
    message_template: messageTemplate,
    route,
    action: String(error.action || '').slice(0, 80),
    stack_location: stackLocation,
  };
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
  return { ...normalized, fingerprint: `sha256:${fingerprint}` };
}

export function findQaEvidencePrivacyViolations(record) {
  const violations = [];
  for (const { key, path, value } of collectKeys(record)) {
    if (FORBIDDEN_EVIDENCE_KEYS.includes(key)) violations.push(`${path}: forbidden field`);
    if (typeof value !== 'string') continue;
    if (/bearer\s+[a-z0-9._~+\/-]+=*/i.test(value)) violations.push(`${path}: bearer credential`);
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) violations.push(`${path}: email address`);
    if (/(?:^|[^\d])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?:$|[^\d])/.test(value)) violations.push(`${path}: phone-like value`);
    if (/https?:\/\/[^\s?#]+\?[^\s]+/i.test(value)) violations.push(`${path}: query string`);
  }
  return [...new Set(violations)];
}

export function validateQaEvidence(record) {
  const errors = [];
  if (!plainObject(record)) return { valid: false, errors: ['record must be an object'] };
  if (record.schema_version !== QA_EVIDENCE_SCHEMA_VERSION) errors.push('schema_version must be 1.0.0');
  if (record.lane !== 'jfl') errors.push('lane must be jfl');
  for (const key of ['run_id', 'level_id', 'seed', 'build_sha', 'worker_version', 'started_at', 'tester_id']) {
    if (!hasRequiredString(record, key)) errors.push(`${key} is required`);
  }
  if (!/^[0-9a-f]{40}$/.test(record.build_sha || '')) errors.push('build_sha must be an exact 40-character Git SHA');
  if (!RUN_OUTCOMES.has(record.outcome)) errors.push('outcome is invalid');
  if (!plainObject(record.device) || !Number.isInteger(record.device?.viewport_width) || !Number.isInteger(record.device?.viewport_height)) {
    errors.push('device viewport dimensions are required integers');
  }
  if (!plainObject(record.fixture_facts) || Object.keys(record.fixture_facts).some((key) => /name/i.test(key))) {
    errors.push('fixture_facts must contain semantic flags, never randomized names');
  }
  if (!Array.isArray(record.assertions) || record.assertions.length === 0) errors.push('assertions must be a non-empty array');
  for (const [index, assertion] of (record.assertions || []).entries()) {
    if (!plainObject(assertion) || !hasRequiredString(assertion, 'assertion_id') || !ASSERTION_OUTCOMES.has(assertion.result)) {
      errors.push(`assertions[${index}] is invalid`);
    }
  }
  for (const [index, event] of (record.events || []).entries()) {
    if (!plainObject(event) || !hasRequiredString(event, 'event_id') || !EVENT_TYPES.has(event.type)) {
      errors.push(`events[${index}] is invalid`);
      continue;
    }
    const allowed = new Set(['event_id', 'type', ...QA_EVENT_FIELDS[event.type]]);
    for (const key of Object.keys(event)) if (!allowed.has(key)) errors.push(`events[${index}].${key} is not allowlisted`);
  }
  if (record.triage && !TRIAGE_LABELS.has(record.triage.label)) errors.push('triage.label is invalid');
  errors.push(...findQaEvidencePrivacyViolations(record));
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
