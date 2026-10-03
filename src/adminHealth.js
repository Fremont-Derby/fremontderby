export function adminHealth({ ok }) {
  if (!ok) return 'Admin health failed. Name the exception before the next action.';
  return 'Admin health is clear.';
}
