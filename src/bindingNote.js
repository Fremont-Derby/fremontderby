export function bindingNote(lane) {
  return `${lane || 'This lane'} must keep its own Supabase binding. Do not copy another lane.`;
}
