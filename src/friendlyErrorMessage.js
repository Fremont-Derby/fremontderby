import { safeClientErrorMessage } from './requestSanitize.js';

/**
 * Single product/infrastructure error mapping for popup + page status.
 * Keep profile and shell on the same rules to avoid multi-agent drift.
 */
export function friendlyErrorMessage(value) {
  if (value && typeof value === 'object' && value.message) {
    return safeClientErrorMessage(value);
  }
  const message = String(value || '').replace(/\s+/g, ' ').trim();
  if (!message) return 'We could not complete that action. Please try again.';

  // Offline / connectivity before generic network mapping.
  if (
    (typeof navigator !== 'undefined' && navigator.onLine === false)
    || /failed to fetch|networkerror|net::err_|load failed|the internet connection appears to be offline/i.test(message)
  ) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You appear to be offline. Reconnect and try again. Nothing was changed.';
    }
    return 'We could not reach the league service. Check your connection and try again. Nothing was changed.';
  }

  if (/sign[- ]?in expired|session expired|unauthorized|sign in is required|jwt/i.test(message)) {
    return 'Your sign-in expired. Open Profile, sign in again, and retry.';
  }

  if (/503|service unavailable|worker threw|cloudflare/i.test(message)) {
    return 'The league service is temporarily unavailable. Please try again in a moment. Nothing was changed.';
  }

  if (/429|rate limit|too many requests|throttl/i.test(message)) {
    return 'Too many requests in a short time. Wait a few seconds and try again.';
  }

  if (/migration|schema cache|PGRST202|function .+ does not exist|could not find the function/i.test(message)) {
    return 'This league feature is still being published. Please try again shortly. Nothing was changed.';
  }

  const mapped = safeClientErrorMessage({ message });
  if (mapped !== message && /could not complete that action/i.test(mapped)) return mapped;
  if (
    /supabase|postgrest|permission denied|schema \"?private\"?|column reference|ambiguous|postgres|PGRST|RPC|relation \".+\" does not exist|duplicate key|violates|statement timeout|service role|browser config/i
      .test(message)
  ) {
    return 'We could not complete that action. Nothing was changed. Please try again.';
  }
  return message;
}
