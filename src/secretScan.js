const PATTERNS = [/github_pat_[A-Za-z0-9_]{8,}/, /sk-[A-Za-z0-9]{8,}/];

export function scanForSecrets(text) {
  const hits = PATTERNS.filter(pattern => pattern.test(String(text || ''))).map(pattern => pattern.source);
  return { ok: hits.length === 0, hits };
}
