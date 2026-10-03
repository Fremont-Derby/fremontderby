export function scoreDrive({ live, failed }) {
  if (failed) return { text: 'If live scoring fails, write the result down and enter it when the page loads.' };
  if (!live) return { text: 'Practice scoring uses fictional players and cannot change the real season.' };
  return { text: 'The live score names both sides.' };
}

export function auditEmpty() {
  return { text: 'No admin events yet. Open a season, then come back.' };
}
