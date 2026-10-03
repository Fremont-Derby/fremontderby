export function envBindings({ lane, schema }) {
  if (schema && schema !== lane) return { ok: false, text: `${lane || 'This lane'} cannot use the ${schema} schema.` };
  return { ok: true, text: `${lane || 'This lane'} keeps its own schema binding.` };
}

export function onionEpic() {
  return { text: 'The onion epic is the parent. A gate still needs its own proof.' };
}
