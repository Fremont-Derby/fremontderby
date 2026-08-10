function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function jsonHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }

  return body;
}

export function createPrizeRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async getSeasonPrizeSummary({ seasonId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_season_prize_summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: seasonId,
        }),
      });

      return Array.isArray(result) ? (result[0] ?? null) : result;
    },

    async configureSeasonPrizes({
      actorUserId,
      seasonId,
      entryFeeCents,
      administrationAmountCents,
      teamAllocationBasisPoints,
      individualAllocationBasisPoints,
      projectedFieldSize,
      payoutTemplates,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/configure_season_prizes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
          configured_entry_fee_cents: entryFeeCents,
          configured_administration_amount_cents: administrationAmountCents,
          configured_team_allocation_basis_points: teamAllocationBasisPoints,
          configured_individual_allocation_basis_points: individualAllocationBasisPoints,
          configured_projected_field_size: projectedFieldSize,
          payout_templates: payoutTemplates,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async finalizeSeasonPrizePayouts({ actorUserId, seasonId, finalizedPayouts }) {
      return requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/finalize_season_prize_payouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
          finalized_payouts: finalizedPayouts,
        }),
      });
    },
  };
}
