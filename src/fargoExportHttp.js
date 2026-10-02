import { buildFargoExportRecord } from './fargoExport.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

export async function handleFargoExportRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await request.json().catch(() => ({}));
    const record = buildFargoExportRecord(body);
    return Response.json(record, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : rpcErrorStatus(error);
    return Response.json(
      { error: safeClientErrorMessage(error) },
      { status: status || 500, headers: { 'cache-control': 'no-store' } },
    );
  }
}
