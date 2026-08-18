/**
 * Shared text helpers so pages do not each reinvent /</g JSON scrubbing
 * or HTML entity escaping (regex hygiene pass).
 */

/** JSON embeddable in a <script> block without breaking out via </script>. */
export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
}

/** Escape text for HTML body/attribute text nodes (not a full HTML sanitizer). */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
