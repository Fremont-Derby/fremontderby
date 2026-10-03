export function homeBarLine(name) {
  const value = String(name || '').trim();
  return value ? `Home bar: ${value}` : 'Home bar not set';
}
