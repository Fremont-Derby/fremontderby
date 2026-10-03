export function laneSchema({ lane, schema }) {
  if (!lane || !schema) return 'Name the lane and its schema before a check.';
  if (schema !== lane) return `${lane} cannot use the ${schema} schema.`;
  return `${lane} keeps its own schema.`;
}
