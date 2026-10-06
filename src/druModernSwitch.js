export function druModernRequested(request) {
  if (!request || request.method !== 'GET') return false;
  try {
    return new URL(request.url).searchParams.get('ui') === 'modern';
  } catch {
    return false;
  }
}
