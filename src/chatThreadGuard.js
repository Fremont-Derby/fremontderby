export function assertSameThread(expectedId, actualId, label = 'conversation') {
  const expected = String(expectedId ?? '').trim();
  if (!expected) return actualId;
  const actual = String(actualId ?? '').trim();
  if (!actual) throw new Error(`${label} id is required`);
  if (expected !== actual) {
    throw new Error(`Reply must stay on the open ${label}`);
  }
  return actual;
}

export function assertWritableThread(allowWrite, label = 'conversation') {
  if (allowWrite === false) {
    throw new Error(`Cannot reply in a distractor ${label}`);
  }
}
