/**
 * Fuzz-ready request guards: size limits, shape limits, UUID checks, text scrubbing.
 * Keep messages stable and non-leaky so fuzzers do not harvest internals.
 */

export const MAX_JSON_BODY_BYTES = 64 * 1024;
export const MAX_JSON_DEPTH = 8;
export const MAX_JSON_KEYS = 80;
export const MAX_STRING_LENGTH = 4000;

// 8-4-4-4-12 hex shape (Postgres uuid text form). Intentionally not RFC 4122 version/variant
// strict: JFL mock seasons and some seed rows use non-RFC variant nibbles but are valid in DB.
const UUID_HEX_SHAPE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** RFC 4122 version (1-5) + variant (8/9/a/b). Prefer for newly generated ids. */
const UUID_RFC4122_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_HEX_SHAPE_RE.test(value.trim());
}

export function isRfc4122Uuid(value) {
  return typeof value === 'string' && UUID_RFC4122_RE.test(value.trim());
}

export function requireUuid(value, label = 'id') {
  const cleaned = String(value ?? '').trim();
  if (!isUuid(cleaned)) {
    const error = new Error(`Invalid ${label}`);
    error.status = 400;
    throw error;
  }
  return cleaned;
}

/** Strip NULs and most control chars; keep \n \r \t for notes. */
export function scrubControlChars(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

export function sanitizeText(value, { maxLength = 500, field = 'text', allowEmpty = true } = {}) {
  if (value == null) {
    if (allowEmpty) return null;
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  if (typeof value !== 'string') {
    const error = new Error(`${field} must be text`);
    error.status = 400;
    throw error;
  }
  const cleaned = scrubControlChars(value).trim();
  if (!cleaned) {
    if (allowEmpty) return null;
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  if (cleaned.length > maxLength) {
    const error = new Error(`${field} must be ${maxLength} characters or fewer`);
    error.status = 400;
    throw error;
  }
  return cleaned;
}

function assertJsonShape(value, depth, keyCount) {
  if (depth > MAX_JSON_DEPTH) {
    const error = new Error('Request body is too deeply nested');
    error.status = 400;
    throw error;
  }
  if (value == null) return keyCount;
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      const error = new Error('Request field is too long');
      error.status = 400;
      throw error;
    }
    return keyCount;
  }
  if (typeof value !== 'object') return keyCount;
  if (Array.isArray(value)) {
    if (value.length > MAX_JSON_KEYS) {
      const error = new Error('Request array is too large');
      error.status = 400;
      throw error;
    }
    for (const item of value) {
      keyCount = assertJsonShape(item, depth + 1, keyCount);
    }
    return keyCount;
  }
  const keys = Object.keys(value);
  keyCount += keys.length;
  if (keyCount > MAX_JSON_KEYS * 4) {
    const error = new Error('Request body has too many fields');
    error.status = 400;
    throw error;
  }
  if (keys.length > MAX_JSON_KEYS) {
    const error = new Error('Request object has too many fields');
    error.status = 400;
    throw error;
  }
  for (const key of keys) {
    if (key.length > 120) {
      const error = new Error('Request field name is too long');
      error.status = 400;
      throw error;
    }
    keyCount = assertJsonShape(value[key], depth + 1, keyCount);
  }
  return keyCount;
}

/**
 * Read and validate a JSON object body with size + shape limits.
 * Shared by Worker handlers so fuzz noise dies at the edge.
 */
export async function readSanitizedJsonBody(request, { maxBytes = MAX_JSON_BODY_BYTES } = {}) {
  const contentType = String(request?.headers?.get?.('content-type') || '');
  if (contentType && !/application\/json/i.test(contentType) && !/text\/plain/i.test(contentType)) {
    // Allow missing content-type; reject odd types that often show up in fuzzing.
    if (/multipart\/|application\/x-www-form-urlencoded/i.test(contentType)) {
      const error = new Error('Request body must be JSON');
      error.status = 415;
      throw error;
    }
  }

  const contentLength = Number(request?.headers?.get?.('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    const error = new Error('Request body is too large');
    error.status = 413;
    throw error;
  }

  let text;
  try {
    text = await request.text();
  } catch {
    const error = new Error('Could not read request body');
    error.status = 400;
    throw error;
  }

  if (text && text.length > maxBytes) {
    const error = new Error('Request body is too large');
    error.status = 413;
    throw error;
  }

  if (!text || !text.trim()) {
    return {};
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    const error = new Error('Request body must be valid JSON');
    error.status = 400;
    throw error;
  }

  if (!body || Array.isArray(body) || typeof body !== 'object') {
    const error = new Error('Request body must be a JSON object');
    error.status = 400;
    throw error;
  }

  assertJsonShape(body, 0, 0);
  return body;
}

/** Map thrown errors to safe client-facing strings (no SQL/stack/schema leakage). */
export function safeClientErrorMessage(error) {
  const status = Number(error?.status) || 0;
  let msg = String(error?.message || 'Request failed').replace(/\s+/g, ' ').trim();
  // Unwrap repository wrappers so product RAISE messages stay readable.
  msg = msg.replace(/^Supabase request failed with \d{3}:\s*/i, '').trim() || msg;

  if (status === 413 || /too large/i.test(msg)) return 'Request body is too large.';
  if (status === 415) return 'Request body must be JSON.';
  if (/valid JSON|JSON object|too deeply|too many fields|field is too long|field name is too long/i.test(msg)) {
    return msg.endsWith('.') ? msg : `${msg}.`;
  }
  if (/invalid input syntax for type uuid|Invalid .*id/i.test(msg)) {
    return 'That link or id is invalid.';
  }
  // Pending migration / missing RPC or column — clearer than a generic failure.
  if (
    /PGRST202|Could not find the function|column .* does not exist|42703/i.test(msg)
  ) {
    return 'This action needs a database update that is not applied yet. Nothing was changed.';
  }
  // Unique-index fallbacks when an RPC missed a product RAISE (prefer RPC pre-checks).
  if (/team_applications_active_captain_unique|already have a team application/i.test(msg)) {
    return 'You already have a team application in this season.';
  }
  if (/team_applications_active_name_unique/i.test(msg)) {
    return 'That team name is already reserved for this season.';
  }
  if (/one_active_team_membership_per_player_season|one_active_captain_team_per_season/i.test(msg)) {
    return 'Player already has an active team membership.';
  }
  if (/teams_season_id_name_key/i.test(msg)) {
    return 'That team name is already used in this season.';
  }
  if (/direct_conversations_season_id_player_low_id_player_high_id_key/i.test(msg)) {
    return 'A conversation with this player already exists for this season.';
  }
  if (
    /supabase|postgrest|permission denied|schema|column reference|ambiguous|postgres|PGRST|RPC|relation |duplicate key|violates|statement timeout|service role|stack|at Object\.|at Module/i.test(
      msg,
    )
  ) {
    return 'We could not complete that action. Nothing was changed. Please try again.';
  }
  // Cap length so fuzzers cannot force huge error bodies.
  if (msg.length > 240) {
    return 'We could not complete that action. Please try again.';
  }
  return msg || 'Request failed';
}

export function safeStatusForError(error, fallbackStatusForError) {
  if (Number(error?.status) >= 400 && Number(error?.status) < 600) {
    return Number(error.status);
  }
  if (typeof fallbackStatusForError === 'function') {
    try {
      return fallbackStatusForError(error);
    } catch {
      return 500;
    }
  }
  return 400;
}
