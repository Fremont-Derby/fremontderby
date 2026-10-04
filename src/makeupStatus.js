export function makeupStatusLabel(match) {
  return match && match.makeupOn ? 'Makeup ' + match.makeupOn : 'No makeup date';
}
