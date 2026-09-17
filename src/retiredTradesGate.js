const RETIRED_TRADE_API_PATTERNS = [
  /^\/api\/me\/trades$/,
  /^\/api\/teams\/[^/]+\/trades$/,
  /^\/api\/team-trades\/[^/]+\/(player-response|captain-approval)$/,
  /^\/api\/admin\/teams\/[^/]+\/trades$/,
];

export function isRetiredTradePath(pathname) {
  return pathname === '/trades'
    || RETIRED_TRADE_API_PATTERNS.some((pattern) => pattern.test(pathname));
}
