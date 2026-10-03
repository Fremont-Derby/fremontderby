export function shortPathLine(path = {}) {
  if (!path.name) return '';
  return `Short path: ${path.name}.`;
}
export function publicProofLine(proof = {}) {
  if (!proof.name) return '';
  return `Public proof: ${proof.name}.`;
}
