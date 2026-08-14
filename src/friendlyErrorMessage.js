/**
 * Single product/infrastructure error mapping for popup + page status.
 * Keep profile and shell on the same rules to avoid multi-agent drift.
 */
export function friendlyErrorMessage(value) {
  const message = String(value || '').replace(/\s+/g, ' ').trim();
  if (!message) return 'We could not complete that action. Please try again.';
  if (/sign[- ]?in expired|session expired|unauthorized|sign in is required|jwt/i.test(message)) {
    return 'Your sign-in expired. Open Profile, sign in again, and retry.';
  }
  if (
    /supabase|postgrest|permission denied|schema \"?private\"?|column reference|ambiguous|postgres|PGRST|RPC|relation \".+\" does not exist|duplicate key|violates|statement timeout|networkerror|failed to fetch|service role|browser config/i
      .test(message)
  ) {
    return 'We could not complete that action. Nothing was changed. Please try again.';
  }
  return message;
}
