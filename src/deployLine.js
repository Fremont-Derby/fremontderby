export function deployLine(lane) {
  return `${lane || 'This lane'} deploys from its own branch command.`;
}
