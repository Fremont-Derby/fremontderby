export function draftCanPublish(status) {
  return String(status || '') === 'draft';
}
